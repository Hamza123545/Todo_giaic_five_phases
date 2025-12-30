"""
Unit Tests for Notification Service - Phase V

Tests cover:
- T071: Email sending (mock SMTP client)
- T071: Dapr Jobs scheduling (mock Dapr client)
- T071: Retry logic (exponential backoff)
- T071: Health check endpoints (/health, /health/ready, /health/live)
- T071: reminder.scheduled event consumption
- T071: reminder_sent flag update

Based on: .claude/skills/dapr-integration, .claude/skills/microservices-patterns
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch, call
from datetime import datetime, timezone
from fastapi.testclient import TestClient

# Phase 5 imports
from phase_5.backend.src.services.notification_service import (
    NotificationService,
    app
)
from phase_5.backend.src.events.schemas import ReminderScheduledEvent


# ==================== Fixtures ====================

@pytest.fixture
def notification_service():
    """Create NotificationService instance with mocked dependencies."""
    with patch('phase_5.backend.src.services.notification_service.get_dapr_client') as mock_dapr, \
         patch('phase_5.backend.src.services.notification_service.get_smtp_client') as mock_smtp, \
         patch('phase_5.backend.src.services.notification_service.DLQHandler') as mock_dlq:

        # Mock Dapr client
        mock_dapr_instance = AsyncMock()
        mock_dapr.return_value = mock_dapr_instance

        # Mock SMTP client
        mock_smtp_instance = AsyncMock()
        mock_smtp.return_value = mock_smtp_instance

        # Mock DLQ handler
        mock_dlq_instance = AsyncMock()
        mock_dlq.return_value = mock_dlq_instance

        service = NotificationService()
        service.dapr = mock_dapr_instance
        service.smtp = mock_smtp_instance
        service.dlq_handler = mock_dlq_instance

        return service


@pytest.fixture
def test_client():
    """Create FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def reminder_event():
    """Sample reminder.scheduled event."""
    return {
        "specversion": "1.0",
        "type": "reminder.scheduled",
        "source": "todo-service",
        "id": "event-123",
        "data": {
            "event_type": "reminder.scheduled",
            "event_version": "1.0",
            "task_id": 456,
            "user_id": "user-789",
            "timestamp": "2025-12-29T10:00:00Z",
            "event_id": "reminder-event-123",
            "payload": {
                "task_title": "Submit report",
                "task_description": "Q4 financial report",
                "reminder_at": "2025-12-31T16:00:00Z",
                "due_date": "2025-12-31T17:00:00Z",
                "user_email": "user@example.com",
                "notification_type": "email"
            }
        }
    }


@pytest.fixture
def job_data():
    """Sample Dapr Jobs API job data."""
    return {
        "type": "reminder",
        "task_id": 456,
        "user_id": "user-789",
        "user_email": "user@example.com",
        "task_title": "Submit report",
        "task_description": "Q4 financial report",
        "due_date": "2025-12-31T17:00:00Z",
        "notification_type": "email"
    }


# ==================== Event Consumption Tests ====================

@pytest.mark.asyncio
async def test_handle_reminder_scheduled_success(notification_service, reminder_event):
    """Test successful processing of reminder.scheduled event."""
    # Arrange
    notification_service.dapr.schedule_job = AsyncMock()

    # Act
    await notification_service.handle_reminder_scheduled(reminder_event)

    # Assert
    notification_service.dapr.schedule_job.assert_called_once()
    call_args = notification_service.dapr.schedule_job.call_args

    assert call_args.kwargs['job_name'] == 'reminder-task-456'
    assert call_args.kwargs['due_time'] == '2025-12-31T16:00:00Z'
    assert call_args.kwargs['data']['type'] == 'reminder'
    assert call_args.kwargs['data']['task_id'] == 456
    assert call_args.kwargs['data']['user_id'] == 'user-789'


@pytest.mark.asyncio
async def test_handle_reminder_scheduled_invalid_schema(notification_service):
    """Test handling of invalid event schema."""
    # Arrange
    invalid_event = {
        "data": {
            "event_type": "reminder.scheduled",
            # Missing required fields
        }
    }

    # Act & Assert
    with pytest.raises(Exception):  # Pydantic validation error
        await notification_service.handle_reminder_scheduled(invalid_event)


@pytest.mark.asyncio
async def test_handle_reminder_scheduled_dapr_failure(notification_service, reminder_event):
    """Test handling of Dapr Jobs API failure."""
    # Arrange
    notification_service.dapr.schedule_job = AsyncMock(
        side_effect=Exception("Dapr connection failed")
    )

    # Act & Assert
    with pytest.raises(Exception, match="Dapr connection failed"):
        await notification_service.handle_reminder_scheduled(reminder_event)


# ==================== Email Sending Tests ====================

@pytest.mark.asyncio
async def test_send_reminder_notification_email_success(notification_service, job_data):
    """Test successful email notification sending."""
    # Arrange
    notification_service.smtp.send_reminder_email = AsyncMock()
    notification_service._update_reminder_sent_flag = AsyncMock()

    # Act
    await notification_service.send_reminder_notification(job_data)

    # Assert
    notification_service.smtp.send_reminder_email.assert_called_once_with(
        to_email='user@example.com',
        task_title='Submit report',
        task_description='Q4 financial report',
        due_date='2025-12-31T17:00:00Z',
        task_id=456
    )
    notification_service._update_reminder_sent_flag.assert_called_once_with(456, 'user-789')


@pytest.mark.asyncio
async def test_send_reminder_notification_push_not_implemented(notification_service, job_data):
    """Test push notification (not yet implemented)."""
    # Arrange
    job_data_push = {**job_data, "notification_type": "push"}
    notification_service._update_reminder_sent_flag = AsyncMock()

    # Act
    await notification_service.send_reminder_notification(job_data_push)

    # Assert - should complete without error but not send anything
    notification_service.smtp.send_reminder_email.assert_not_called()
    # Flag update should still be called
    notification_service._update_reminder_sent_flag.assert_called_once()


# ==================== Retry Logic Tests ====================

@pytest.mark.asyncio
async def test_send_reminder_notification_retry_success_on_second_attempt(notification_service, job_data):
    """Test retry succeeds on second attempt."""
    # Arrange
    notification_service.smtp.send_reminder_email = AsyncMock(
        side_effect=[
            Exception("SMTP timeout"),  # First attempt fails
            None  # Second attempt succeeds
        ]
    )
    notification_service._update_reminder_sent_flag = AsyncMock()

    # Act
    await notification_service.send_reminder_notification(job_data)

    # Assert
    assert notification_service.smtp.send_reminder_email.call_count == 2
    notification_service._update_reminder_sent_flag.assert_called_once()


@pytest.mark.asyncio
async def test_send_reminder_notification_max_retries_exceeded(notification_service, job_data):
    """Test DLQ handling after max retries exceeded."""
    # Arrange
    notification_service.smtp.send_reminder_email = AsyncMock(
        side_effect=Exception("SMTP connection refused")
    )
    notification_service._update_reminder_sent_flag = AsyncMock()
    notification_service._alert_user_failed_reminder = AsyncMock()
    notification_service.dlq_handler.handle_failed_event = AsyncMock()

    # Act & Assert
    with pytest.raises(Exception, match="SMTP connection refused"):
        await notification_service.send_reminder_notification(job_data)

    # Verify DLQ handler was called
    notification_service.dlq_handler.handle_failed_event.assert_called_once()

    # Verify user was alerted
    notification_service._alert_user_failed_reminder.assert_called_once()

    # Verify reminder_sent flag was NOT updated
    notification_service._update_reminder_sent_flag.assert_not_called()


@pytest.mark.asyncio
async def test_send_reminder_notification_exponential_backoff(notification_service, job_data, monkeypatch):
    """Test exponential backoff timing (1s, 2s, 4s...)."""
    # Arrange
    sleep_calls = []

    async def mock_sleep(delay):
        sleep_calls.append(delay)

    monkeypatch.setattr(asyncio, 'sleep', mock_sleep)

    notification_service.smtp.send_reminder_email = AsyncMock(
        side_effect=[
            Exception("Retry 1"),
            Exception("Retry 2"),
            Exception("Retry 3"),
            None  # Success on 4th attempt
        ]
    )
    notification_service._update_reminder_sent_flag = AsyncMock()

    # Act
    await notification_service.send_reminder_notification(job_data)

    # Assert - verify exponential backoff delays
    assert sleep_calls == [1, 2, 4]  # First 3 retries


# ==================== Reminder Sent Flag Update Tests ====================

@pytest.mark.asyncio
async def test_update_reminder_sent_flag_success(notification_service):
    """Test successful reminder_sent flag update via Dapr Service Invocation."""
    # Arrange
    notification_service.dapr.invoke_service = AsyncMock()

    # Act
    await notification_service._update_reminder_sent_flag(456, 'user-789')

    # Assert
    notification_service.dapr.invoke_service.assert_called_once_with(
        app_id='backend',
        method='api/user-789/tasks/456/reminder-sent',
        data={'reminder_sent': True},
        http_verb='PATCH'
    )


@pytest.mark.asyncio
async def test_update_reminder_sent_flag_failure_non_critical(notification_service):
    """Test non-critical failure of reminder_sent flag update."""
    # Arrange
    notification_service.dapr.invoke_service = AsyncMock(
        side_effect=Exception("Backend service unavailable")
    )

    # Act - should not raise exception (non-critical failure)
    await notification_service._update_reminder_sent_flag(456, 'user-789')

    # Assert - exception was caught and logged


# ==================== User Alert Tests ====================

@pytest.mark.asyncio
async def test_alert_user_failed_reminder_success(notification_service):
    """Test user alert for failed reminder delivery."""
    # Arrange
    notification_service.smtp.send_email = AsyncMock()

    # Act
    await notification_service._alert_user_failed_reminder(
        user_email='user@example.com',
        task_title='Submit report',
        task_id=456
    )

    # Assert
    notification_service.smtp.send_email.assert_called_once()
    call_args = notification_service.smtp.send_email.call_args

    assert call_args.kwargs['to_email'] == 'user@example.com'
    assert 'Reminder Delivery Failed' in call_args.kwargs['subject']
    assert 'Submit report' in call_args.kwargs['body']
    assert '456' in call_args.kwargs['body']


@pytest.mark.asyncio
async def test_alert_user_failed_reminder_smtp_failure(notification_service):
    """Test handling of SMTP failure when alerting user."""
    # Arrange
    notification_service.smtp.send_email = AsyncMock(
        side_effect=Exception("SMTP unavailable")
    )

    # Act - should not raise exception (best-effort alert)
    await notification_service._alert_user_failed_reminder(
        user_email='user@example.com',
        task_title='Submit report',
        task_id=456
    )

    # Assert - exception was caught and logged


# ==================== Job Callback Tests ====================

@pytest.mark.asyncio
async def test_handle_job_callback_reminder_type(notification_service, job_data):
    """Test job callback routing for reminder type."""
    # Arrange
    notification_service.send_reminder_notification = AsyncMock()

    # Act
    await notification_service.handle_job_callback(job_data)

    # Assert
    notification_service.send_reminder_notification.assert_called_once_with(job_data)


@pytest.mark.asyncio
async def test_handle_job_callback_unknown_type(notification_service):
    """Test job callback with unknown job type."""
    # Arrange
    unknown_job = {"type": "unknown"}

    # Act
    await notification_service.handle_job_callback(unknown_job)

    # Assert - should log warning but not raise exception


# ==================== Health Check Tests ====================

def test_health_check_endpoint(test_client):
    """Test /health endpoint returns healthy status."""
    # Act
    response = test_client.get("/health")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "notification-service"
    assert "version" in data


def test_readiness_check_endpoint_ready(test_client):
    """Test /health/ready endpoint when dependencies are ready."""
    # Act
    with patch('phase_5.backend.src.services.notification_service.get_dapr_client'), \
         patch('phase_5.backend.src.services.notification_service.get_smtp_client'):
        response = test_client.get("/health/ready")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"


def test_liveness_check_endpoint(test_client):
    """Test /health/live endpoint always returns alive."""
    # Act
    response = test_client.get("/health/live")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "alive"


# ==================== Integration Tests (FastAPI Routes) ====================

def test_dapr_subscribe_endpoint(test_client):
    """Test Dapr subscription endpoint returns correct configuration."""
    # Act
    response = test_client.post("/dapr/subscribe")

    # Assert
    assert response.status_code == 200
    subscriptions = response.json()

    assert len(subscriptions) == 1
    assert subscriptions[0]["pubsubname"] == "kafka-pubsub"
    assert subscriptions[0]["topic"] == "reminders"
    assert subscriptions[0]["route"] == "/api/events/reminders"


def test_handle_reminder_event_endpoint_success(test_client, reminder_event):
    """Test /api/events/reminders endpoint with valid event."""
    # Act
    with patch('phase_5.backend.src.services.notification_service.notification_service.handle_reminder_scheduled', new=AsyncMock()):
        response = test_client.post("/api/events/reminders", json=reminder_event)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"


def test_handle_reminder_event_endpoint_error(test_client, reminder_event):
    """Test /api/events/reminders endpoint with processing error."""
    # Arrange
    mock_handler = AsyncMock(side_effect=Exception("Processing failed"))

    # Act
    with patch('phase_5.backend.src.services.notification_service.notification_service.handle_reminder_scheduled', new=mock_handler):
        response = test_client.post("/api/events/reminders", json=reminder_event)

    # Assert
    assert response.status_code == 500
    data = response.json()
    assert data["status"] == "error"
    assert "Processing failed" in data["message"]


def test_handle_job_trigger_endpoint_success(test_client, job_data):
    """Test /api/jobs/trigger endpoint with valid job payload."""
    # Arrange
    job_payload = {
        "jobName": "reminder-task-456",
        "data": job_data
    }

    # Act
    with patch('phase_5.backend.src.services.notification_service.notification_service.handle_job_callback', new=AsyncMock()):
        response = test_client.post("/api/jobs/trigger", json=job_payload)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"


def test_handle_job_trigger_endpoint_json_string_data(test_client):
    """Test /api/jobs/trigger endpoint with JSON string data."""
    # Arrange
    import json
    job_payload = {
        "jobName": "reminder-task-456",
        "data": json.dumps({
            "type": "reminder",
            "task_id": 456,
            "user_id": "user-789"
        })
    }

    # Act
    with patch('phase_5.backend.src.services.notification_service.notification_service.handle_job_callback', new=AsyncMock()):
        response = test_client.post("/api/jobs/trigger", json=job_payload)

    # Assert
    assert response.status_code == 200


def test_handle_job_trigger_endpoint_error(test_client, job_data):
    """Test /api/jobs/trigger endpoint with processing error."""
    # Arrange
    job_payload = {"jobName": "reminder-task-456", "data": job_data}
    mock_handler = AsyncMock(side_effect=Exception("Job processing failed"))

    # Act
    with patch('phase_5.backend.src.services.notification_service.notification_service.handle_job_callback', new=mock_handler):
        response = test_client.post("/api/jobs/trigger", json=job_payload)

    # Assert
    assert response.status_code == 500
    data = response.json()
    assert data["status"] == "FAILED"
    assert "Job processing failed" in data["message"]


# ==================== Edge Cases ====================

@pytest.mark.asyncio
async def test_handle_reminder_scheduled_missing_user_id(notification_service):
    """Test event with missing user_id."""
    # Arrange
    event_missing_user = {
        "data": {
            "event_type": "reminder.scheduled",
            "task_id": 456,
            # Missing user_id
        }
    }

    # Act & Assert
    with pytest.raises(Exception):
        await notification_service.handle_reminder_scheduled(event_missing_user)


@pytest.mark.asyncio
async def test_send_reminder_notification_empty_description(notification_service):
    """Test reminder with empty task description."""
    # Arrange
    job_data_no_desc = {
        "type": "reminder",
        "task_id": 456,
        "user_id": "user-789",
        "user_email": "user@example.com",
        "task_title": "Submit report",
        "task_description": "",  # Empty description
        "due_date": "2025-12-31T17:00:00Z",
        "notification_type": "email"
    }

    notification_service.smtp.send_reminder_email = AsyncMock()
    notification_service._update_reminder_sent_flag = AsyncMock()

    # Act
    await notification_service.send_reminder_notification(job_data_no_desc)

    # Assert - should handle empty description gracefully
    notification_service.smtp.send_reminder_email.assert_called_once()
