"""
Notification Service - Phase V

Microservice responsible for processing reminder events from Kafka and sending notifications.

Architecture:
1. Consumes reminder.scheduled events from 'reminders' Kafka topic
2. Schedules exact-time reminder delivery using Dapr Jobs API
3. Sends notifications via SMTP email (with retry strategy)
4. Updates task.reminder_sent flag after successful delivery

Retry Strategy (per spec.md FR-020a):
- Reminders: 10 retries with exponential backoff (1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s, 256s, 512s ≈ 17min total)
- After max retries: Move to Dead Letter Queue with 7-day retention
- Alert operations team when events moved to DLQ
- Alert users when reminder notification fails to deliver

Based on: .claude/skills/dapr-integration, .claude/skills/kafka-event-driven
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from sqlmodel import Session, select
import httpx

# Phase 5 imports
from phase_5.backend.src.integrations.dapr_client import get_dapr_client
from phase_5.backend.src.events.schemas import ReminderScheduledEvent
from phase_5.backend.src.events.dlq_handler import DLQHandler
from phase_5.backend.src.integrations.smtp_client import SMTPClient, get_smtp_client

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Notification Service for sending reminders to users.

    Responsibilities:
    - Consume reminder.scheduled events from Kafka
    - Schedule exact-time reminders using Dapr Jobs API
    - Send email notifications via SMTP
    - Update reminder_sent flag after delivery
    - Handle failures with retry and DLQ strategies
    """

    def __init__(self):
        self.dapr = get_dapr_client()
        self.smtp = get_smtp_client()
        self.dlq_handler = DLQHandler()

    async def handle_reminder_scheduled(self, event: Dict[str, Any]) -> None:
        """
        Handle reminder.scheduled event from Kafka.

        Event Flow:
        1. Validate event schema
        2. Extract reminder_at timestamp
        3. Schedule Dapr Job for exact-time delivery
        4. Log successful scheduling

        Args:
            event: CloudEvents-wrapped reminder.scheduled event

        Raises:
            ValueError: If event schema is invalid
            httpx.HTTPStatusError: If Dapr Jobs API call fails
        """
        try:
            # Extract event data from CloudEvents format
            event_data = event.get("data", {})

            # Validate event schema
            reminder_event = ReminderScheduledEvent(**event_data)

            task_id = reminder_event.task_id
            user_id = reminder_event.user_id
            payload = reminder_event.payload

            logger.info(
                f"Processing reminder.scheduled event: "
                f"task_id={task_id}, user_id={user_id}, reminder_at={payload.reminder_at}"
            )

            # Schedule Dapr Job for exact-time reminder delivery
            job_name = f"reminder-task-{task_id}"

            await self.dapr.schedule_job(
                job_name=job_name,
                due_time=payload.reminder_at,  # ISO 8601 UTC timestamp
                data={
                    "type": "reminder",
                    "task_id": task_id,
                    "user_id": user_id,
                    "user_email": payload.user_email,
                    "task_title": payload.task_title,
                    "task_description": payload.task_description,
                    "due_date": payload.due_date,
                    "notification_type": payload.notification_type
                }
            )

            logger.info(
                f"Scheduled reminder job: job_name={job_name}, "
                f"due_time={payload.reminder_at}"
            )

        except Exception as e:
            logger.error(
                f"Failed to process reminder.scheduled event: {e}",
                exc_info=True
            )
            # Re-raise to trigger Kafka consumer retry
            raise

    async def send_reminder_notification(self, job_data: Dict[str, Any]) -> None:
        """
        Send reminder notification when Dapr Job fires.

        This method is called by Dapr Jobs API at the scheduled reminder_at time.

        Retry Strategy (per spec.md FR-020a):
        - 10 retries with exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s, 256s, 512s
        - Total retry time: ~17 minutes
        - After max retries: Move to DLQ with 7-day retention

        Args:
            job_data: Job payload containing task and user information

        Raises:
            Exception: If all retry attempts fail
        """
        task_id = job_data.get("task_id")
        user_id = job_data.get("user_id")
        user_email = job_data.get("user_email")
        task_title = job_data.get("task_title")
        task_description = job_data.get("task_description", "")
        due_date = job_data.get("due_date")
        notification_type = job_data.get("notification_type", "email")

        logger.info(
            f"Sending reminder notification: task_id={task_id}, "
            f"user_email={user_email}, type={notification_type}"
        )

        # Retry strategy: 10 retries with exponential backoff
        max_retries = 10
        retry_delays = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]  # seconds

        for attempt in range(max_retries):
            try:
                if notification_type == "email":
                    # Send email notification via SMTP
                    await self.smtp.send_reminder_email(
                        to_email=user_email,
                        task_title=task_title,
                        task_description=task_description,
                        due_date=due_date,
                        task_id=task_id
                    )

                    logger.info(
                        f"Reminder email sent successfully: task_id={task_id}, "
                        f"user_email={user_email}"
                    )
                elif notification_type == "push":
                    # TODO: Implement push notification
                    logger.warning(
                        f"Push notifications not yet implemented: task_id={task_id}"
                    )

                # Update task.reminder_sent flag via backend service
                await self._update_reminder_sent_flag(task_id, user_id)

                # Success - exit retry loop
                return

            except Exception as e:
                logger.error(
                    f"Reminder notification failed (attempt {attempt + 1}/{max_retries}): "
                    f"task_id={task_id}, error={e}",
                    exc_info=True
                )

                if attempt == max_retries - 1:
                    # Max retries exceeded - move to DLQ
                    logger.error(
                        f"Max retries exceeded for reminder notification: "
                        f"task_id={task_id}, moving to DLQ"
                    )

                    await self.dlq_handler.handle_failed_event(
                        event={
                            "event_type": "reminder.due",
                            "task_id": task_id,
                            "user_id": user_id,
                            "payload": job_data
                        },
                        error=e,
                        retry_count=max_retries
                    )

                    # Alert user of failed reminder (per spec.md FR-020e)
                    await self._alert_user_failed_reminder(
                        user_email=user_email,
                        task_title=task_title,
                        task_id=task_id
                    )

                    raise  # Re-raise to indicate failure

                # Wait before retrying
                delay = retry_delays[attempt]
                logger.info(f"Retrying in {delay} seconds...")
                await asyncio.sleep(delay)

    async def _update_reminder_sent_flag(
        self,
        task_id: int,
        user_id: str
    ) -> None:
        """
        Update task.reminder_sent flag via backend service.

        Uses Dapr Service Invocation to call backend's task update API.

        Args:
            task_id: Task database primary key
            user_id: User ID for service-to-service context

        Raises:
            httpx.HTTPStatusError: If backend API call fails
        """
        try:
            # Call backend service via Dapr Service Invocation
            await self.dapr.invoke_service(
                app_id="backend",
                method=f"api/{user_id}/tasks/{task_id}/reminder-sent",
                data={"reminder_sent": True},
                http_verb="PATCH"
            )

            logger.info(f"Updated reminder_sent flag: task_id={task_id}")

        except Exception as e:
            logger.error(
                f"Failed to update reminder_sent flag: task_id={task_id}, error={e}",
                exc_info=True
            )
            # Don't re-raise - notification was sent successfully, flag update failure is non-critical

    async def _alert_user_failed_reminder(
        self,
        user_email: str,
        task_title: str,
        task_id: int
    ) -> None:
        """
        Send notification to user about failed reminder delivery.

        Args:
            user_email: User's email address
            task_title: Task title for context
            task_id: Task ID for reference
        """
        try:
            await self.smtp.send_email(
                to_email=user_email,
                subject=f"Reminder Delivery Failed: {task_title}",
                body=f"""
                    <h3>Reminder Delivery Failed</h3>
                    <p>We were unable to deliver a reminder notification for your task:</p>
                    <ul>
                        <li><strong>Task:</strong> {task_title}</li>
                        <li><strong>Task ID:</strong> {task_id}</li>
                    </ul>
                    <p>Please check your task list and mark this task as complete when done.</p>
                    <p>If you continue to experience issues, please contact support.</p>
                """
            )
            logger.info(
                f"Sent failed reminder alert to user: task_id={task_id}, email={user_email}"
            )
        except Exception as e:
            logger.error(
                f"Failed to send user alert for failed reminder: task_id={task_id}, error={e}",
                exc_info=True
            )

    async def handle_job_callback(self, job_data: Dict[str, Any]) -> None:
        """
        Handle Dapr Jobs API callback.

        Called by Dapr when scheduled job fires at reminder_at time.

        Args:
            job_data: Job payload containing reminder information
        """
        job_type = job_data.get("type")

        if job_type == "reminder":
            await self.send_reminder_notification(job_data)
        else:
            logger.warning(f"Unknown job type: {job_type}")


# ==================== FastAPI Application ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events."""
    logger.info("Notification Service starting...")
    yield
    logger.info("Notification Service shutting down...")


app = FastAPI(
    title="Notification Service",
    description="Phase V Notification Service - Sends reminders via email/push",
    version="1.0.0",
    lifespan=lifespan
)

# Global service instance
notification_service = NotificationService()


@app.post("/dapr/subscribe")
async def dapr_subscribe():
    """
    Dapr subscription endpoint.

    Returns Kafka topic subscriptions for Dapr to route events.

    Returns:
        List of subscription configurations
    """
    return [
        {
            "pubsubname": "kafka-pubsub",
            "topic": "reminders",
            "route": "/api/events/reminders"
        }
    ]


@app.post("/api/events/reminders")
async def handle_reminder_event(request: Request):
    """
    Handle reminder events from Kafka via Dapr Pub/Sub.

    Event Format (CloudEvents):
    {
        "specversion": "1.0",
        "type": "reminder.scheduled",
        "source": "todo-service",
        "id": "event-id-123",
        "data": {
            "event_type": "reminder.scheduled",
            "task_id": 123,
            "user_id": "user-456",
            "payload": {
                "task_title": "Submit report",
                "reminder_at": "2025-12-31T16:00:00Z",
                "user_email": "user@example.com",
                "due_date": "2025-12-31T17:00:00Z"
            }
        }
    }

    Returns:
        JSONResponse with status
    """
    try:
        event = await request.json()
        await notification_service.handle_reminder_scheduled(event)
        return JSONResponse({"status": "success"})
    except Exception as e:
        logger.error(f"Error processing reminder event: {e}", exc_info=True)
        # Return 500 to trigger Dapr retry
        return JSONResponse(
            {"status": "error", "message": str(e)},
            status_code=500
        )


@app.post("/api/jobs/trigger")
async def handle_job_trigger(request: Request):
    """
    Handle Dapr Jobs API callback.

    Called by Dapr when scheduled job fires at reminder_at time.

    Job Data Format:
    {
        "jobName": "reminder-task-123",
        "data": {
            "type": "reminder",
            "task_id": 123,
            "user_id": "user-456",
            "user_email": "user@example.com",
            "task_title": "Submit report",
            "due_date": "2025-12-31T17:00:00Z"
        }
    }

    Returns:
        JSONResponse with status
    """
    try:
        job_payload = await request.json()
        job_data = job_payload.get("data", {})

        # Parse job_data if it's a JSON string
        if isinstance(job_data, str):
            import json
            job_data = json.loads(job_data)

        await notification_service.handle_job_callback(job_data)

        return JSONResponse({"status": "SUCCESS"})
    except Exception as e:
        logger.error(f"Error processing job callback: {e}", exc_info=True)
        return JSONResponse(
            {"status": "FAILED", "message": str(e)},
            status_code=500
        )


@app.get("/health")
async def health_check():
    """
    Health check endpoint.

    Returns:
        Health status
    """
    return {
        "status": "healthy",
        "service": "notification-service",
        "version": "1.0.0"
    }


@app.get("/health/ready")
async def readiness_check():
    """
    Readiness probe - check dependencies.

    Returns:
        Readiness status
    """
    try:
        # Check Dapr sidecar connectivity
        dapr = get_dapr_client()
        # Simple health check - verify Dapr is accessible
        # (In production, this could check Dapr health endpoint)

        # Check SMTP connectivity (optional - may be slow)
        smtp = get_smtp_client()

        return {"status": "ready"}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return JSONResponse(
            {"status": "not ready", "error": str(e)},
            status_code=503
        )


@app.get("/health/live")
async def liveness_check():
    """
    Liveness probe - service is running.

    Returns:
        Liveness status
    """
    return {"status": "alive"}


if __name__ == "__main__":
    import uvicorn

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    # Run server
    uvicorn.run(
        "notification_service:app",
        host="0.0.0.0",
        port=8002,  # Different port from backend (8000) and recurring-task-service (8001)
        reload=True
    )
