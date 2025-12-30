"""
Dead Letter Queue (DLQ) Handler - Phase V

Handles failed events that exceed max retry attempts.

Retry Strategies (per spec.md FR-020a):
- Task completion events: 3 retries with exponential backoff (30s, 5min, 30min)
- Reminder events: 10 retries with exponential backoff (1s to 512s ≈ 17min total)
- Task update events: 5 retries with exponential backoff (1s to 16s ≈ 31s total)

DLQ Retention Periods (per spec.md FR-020c):
- Task completion events: 30-day retention
- Reminder events: 7-day retention
- Task update events: 14-day retention

Alerting (per spec.md FR-020d, FR-020e):
- Alert operations team when events moved to DLQ
- Alert users when reminder notifications fail to deliver

Based on: .claude/skills/kafka-event-driven
"""

import logging
from typing import Dict, Any
from datetime import datetime, timedelta
from enum import Enum

from phase_5.backend.src.integrations.dapr_client import get_dapr_client

logger = logging.getLogger(__name__)


class EventType(str, Enum):
    """Event types with specific retry/DLQ strategies."""
    TASK_COMPLETED = "task.completed"
    REMINDER_DUE = "reminder.due"
    TASK_UPDATED = "task.updated"


# Retry strategies: [delay1, delay2, delay3, ...]
RETRY_STRATEGIES: Dict[EventType, list[int]] = {
    EventType.TASK_COMPLETED: [30, 300, 1800],  # 30s, 5min, 30min (3 retries)
    EventType.REMINDER_DUE: [1, 2, 4, 8, 16, 32, 64, 128, 256, 512],  # 1s to 512s (10 retries)
    EventType.TASK_UPDATED: [1, 2, 4, 8, 16],  # 1s to 16s (5 retries)
}

# Max retry counts
MAX_RETRIES: Dict[EventType, int] = {
    EventType.TASK_COMPLETED: 3,
    EventType.REMINDER_DUE: 10,
    EventType.TASK_UPDATED: 5,
}

# DLQ retention periods (days)
DLQ_RETENTION: Dict[EventType, int] = {
    EventType.TASK_COMPLETED: 30,  # 30 days
    EventType.REMINDER_DUE: 7,      # 7 days
    EventType.TASK_UPDATED: 14,     # 14 days
}


class DLQHandler:
    """
    Dead Letter Queue handler for failed events.

    Responsibilities:
    - Move failed events to DLQ after max retries exceeded
    - Alert operations team
    - Alert users for failed reminder notifications
    - Maintain DLQ retention policies
    """

    def __init__(self):
        self.dapr = get_dapr_client()

    async def handle_failed_event(
        self,
        event: Dict[str, Any],
        error: Exception,
        retry_count: int
    ) -> None:
        """
        Handle failed event after max retries exceeded.

        Actions:
        1. Move event to DLQ topic (dlq-{original-topic})
        2. Alert operations team
        3. Alert user (if reminder event)

        Args:
            event: Failed event data
            error: Exception that caused the failure
            retry_count: Number of retry attempts made

        Raises:
            httpx.HTTPStatusError: If DLQ publish fails
        """
        event_type = event.get("event_type")
        task_id = event.get("task_id")
        user_id = event.get("user_id")

        logger.error(
            f"Moving event to DLQ: event_type={event_type}, task_id={task_id}, "
            f"retry_count={retry_count}, error={error}"
        )

        # Determine DLQ topic
        dlq_topic = self._get_dlq_topic(event_type)

        # Add DLQ metadata
        dlq_event = {
            **event,
            "dlq_metadata": {
                "failed_at": datetime.utcnow().isoformat() + "Z",
                "error": str(error),
                "error_type": type(error).__name__,
                "retry_count": retry_count,
                "retention_days": self._get_retention_days(event_type)
            }
        }

        # Publish to DLQ topic
        await self.dapr.publish_event(
            topic=dlq_topic,
            event_data=dlq_event,
            user_id=user_id
        )

        logger.info(
            f"Event moved to DLQ: topic={dlq_topic}, task_id={task_id}, "
            f"retention_days={dlq_event['dlq_metadata']['retention_days']}"
        )

        # Alert operations team
        await self._alert_ops_team(event, error, retry_count)

        # Alert user if reminder failed
        if event_type == EventType.REMINDER_DUE.value:
            await self._alert_user_failed_reminder(event)

    def _get_dlq_topic(self, event_type: str) -> str:
        """
        Get DLQ topic name for event type.

        Mapping:
        - task.completed -> dlq-task-events
        - reminder.due -> dlq-reminders
        - task.updated -> dlq-task-updates

        Args:
            event_type: Event type string

        Returns:
            DLQ topic name
        """
        if event_type == EventType.TASK_COMPLETED.value:
            return "dlq-task-events"
        elif event_type == EventType.REMINDER_DUE.value:
            return "dlq-reminders"
        elif event_type == EventType.TASK_UPDATED.value:
            return "dlq-task-updates"
        else:
            return "dlq-unknown"

    def _get_retention_days(self, event_type: str) -> int:
        """
        Get DLQ retention period for event type.

        Args:
            event_type: Event type string

        Returns:
            Retention period in days
        """
        try:
            return DLQ_RETENTION[EventType(event_type)]
        except (KeyError, ValueError):
            return 7  # Default: 7 days

    async def _alert_ops_team(
        self,
        event: Dict[str, Any],
        error: Exception,
        retry_count: int
    ) -> None:
        """
        Alert operations team about failed event.

        In production, this would send alerts via:
        - Email (SMTP)
        - Slack webhook
        - PagerDuty API
        - Prometheus AlertManager

        For now, we log the alert (which gets captured by centralized logging).

        Args:
            event: Failed event data
            error: Exception that caused the failure
            retry_count: Number of retry attempts made
        """
        alert_message = {
            "alert_type": "event_dlq",
            "severity": "warning",
            "event_type": event.get("event_type"),
            "task_id": event.get("task_id"),
            "user_id": event.get("user_id"),
            "error": str(error),
            "error_type": type(error).__name__,
            "retry_count": retry_count,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

        logger.warning(
            f"⚠️ OPS ALERT: Event moved to DLQ: {alert_message}",
            extra={"alert": alert_message}
        )

        # TODO: Implement actual alerting integrations
        # await send_slack_alert(alert_message)
        # await send_pagerduty_alert(alert_message)

    async def _alert_user_failed_reminder(self, event: Dict[str, Any]) -> None:
        """
        Alert user about failed reminder notification (per spec.md FR-020e).

        This is handled by the Notification Service's _alert_user_failed_reminder method.
        This method is a placeholder for DLQ-level user alerting.

        Args:
            event: Failed reminder event
        """
        logger.info(
            f"User alert for failed reminder handled by Notification Service: "
            f"task_id={event.get('task_id')}, user_id={event.get('user_id')}"
        )

    @staticmethod
    def get_retry_strategy(event_type: str) -> list[int]:
        """
        Get retry delays for event type.

        Args:
            event_type: Event type string

        Returns:
            List of retry delays in seconds
        """
        try:
            return RETRY_STRATEGIES[EventType(event_type)]
        except (KeyError, ValueError):
            return [1, 2, 4]  # Default: 3 retries with exponential backoff

    @staticmethod
    def get_max_retries(event_type: str) -> int:
        """
        Get max retry count for event type.

        Args:
            event_type: Event type string

        Returns:
            Maximum number of retry attempts
        """
        try:
            return MAX_RETRIES[EventType(event_type)]
        except (KeyError, ValueError):
            return 3  # Default: 3 retries
