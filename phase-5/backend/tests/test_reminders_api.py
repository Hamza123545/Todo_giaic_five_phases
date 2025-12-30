"""
API Tests for Reminder Functionality - Phase V

Tests for User Story 2: Due Dates & Reminders

Test Coverage:
- T078: API tests for reminder creation
- Reminder scheduling with reminder_offset_hours parameter
- Reminder validation (requires due_date)
- Reminder cancellation when task completed before reminder_at
- Event publishing verification
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi import status
from httpx import AsyncClient

from main import app
from models import Task
from src.events.schemas import ReminderScheduledEvent


class TestReminderCreation:
    """Test reminder creation with due_date and reminder_offset_hours."""

    @pytest.mark.asyncio
    async def test_create_task_with_reminder_1_hour_before(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_user_id: str,
        mock_event_publisher
    ):
        """Test creating task with 1-hour reminder offset."""
        # Arrange
        due_date = (datetime.utcnow() + timedelta(hours=24)).replace(microsecond=0)
        reminder_offset_hours = 1

        task_data = {
            "title": "Submit report",
            "description": "Q4 financial report",
            "priority": "high",
            "due_date": due_date.isoformat() + "Z",
            "reminder_offset_hours": reminder_offset_hours
        }

        # Act
        response = await async_client.post(
            f"/api/{test_user_id}/tasks",
            json=task_data,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["success"] is True
        assert data["data"]["title"] == "Submit report"
        assert data["data"]["due_date"] == due_date.isoformat() + "Z"

        # Verify reminder_at is calculated correctly (due_date - 1 hour)
        expected_reminder_at = (due_date - timedelta(hours=1))
        assert data["data"]["reminder_at"] == expected_reminder_at.isoformat() + "Z"
        assert data["data"]["reminder_sent"] is False

        # Verify reminder.scheduled event was published
        mock_event_publisher.publish_reminder_scheduled.assert_called_once()
        published_event = mock_event_publisher.publish_reminder_scheduled.call_args[0][0]
        assert isinstance(published_event, ReminderScheduledEvent)
        assert published_event.user_id == test_user_id
        assert published_event.payload.task_title == "Submit report"
        assert published_event.payload.reminder_at == expected_reminder_at.isoformat() + "Z"

    @pytest.mark.asyncio
    async def test_create_task_with_reminder_1_week_before(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_user_id: str,
        mock_event_publisher
    ):
        """Test creating task with 1-week (168 hours) reminder offset."""
        # Arrange
        due_date = (datetime.utcnow() + timedelta(days=14)).replace(microsecond=0)
        reminder_offset_hours = 168  # 1 week

        task_data = {
            "title": "Project deadline",
            "due_date": due_date.isoformat() + "Z",
            "reminder_offset_hours": reminder_offset_hours
        }

        # Act
        response = await async_client.post(
            f"/api/{test_user_id}/tasks",
            json=task_data,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        expected_reminder_at = (due_date - timedelta(hours=168))
        assert data["data"]["reminder_at"] == expected_reminder_at.isoformat() + "Z"


class TestReminderValidation:
    """Test validation rules for reminder_offset_hours."""

    @pytest.mark.asyncio
    async def test_create_task_reminder_requires_due_date(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_user_id: str
    ):
        """Test that reminder_offset_hours requires due_date."""
        # Arrange
        task_data = {
            "title": "Task without due date",
            "reminder_offset_hours": 1  # Invalid: no due_date
        }

        # Act
        response = await async_client.post(
            f"/api/{test_user_id}/tasks",
            json=task_data,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data["success"] is False
        assert "reminder_offset_hours can only be set if due_date is provided" in data["error"]["message"]

    @pytest.mark.asyncio
    async def test_create_task_reminder_offset_below_minimum(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_user_id: str
    ):
        """Test reminder_offset_hours minimum validation (1 hour)."""
        # Arrange
        due_date = (datetime.utcnow() + timedelta(hours=24))
        task_data = {
            "title": "Task with invalid reminder",
            "due_date": due_date.isoformat() + "Z",
            "reminder_offset_hours": 0  # Invalid: below minimum
        }

        # Act
        response = await async_client.post(
            f"/api/{test_user_id}/tasks",
            json=task_data,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        # Pydantic validation error for ge=1 constraint

    @pytest.mark.asyncio
    async def test_create_task_reminder_offset_above_maximum(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_user_id: str
    ):
        """Test reminder_offset_hours maximum validation (168 hours = 1 week)."""
        # Arrange
        due_date = (datetime.utcnow() + timedelta(days=30))
        task_data = {
            "title": "Task with invalid reminder",
            "due_date": due_date.isoformat() + "Z",
            "reminder_offset_hours": 200  # Invalid: above maximum
        }

        # Act
        response = await async_client.post(
            f"/api/{test_user_id}/tasks",
            json=task_data,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        # Pydantic validation error for le=168 constraint

    @pytest.mark.asyncio
    async def test_create_task_without_reminder(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_user_id: str,
        mock_event_publisher
    ):
        """Test creating task with due_date but no reminder."""
        # Arrange
        due_date = (datetime.utcnow() + timedelta(hours=24))
        task_data = {
            "title": "Task without reminder",
            "due_date": due_date.isoformat() + "Z"
            # No reminder_offset_hours
        }

        # Act
        response = await async_client.post(
            f"/api/{test_user_id}/tasks",
            json=task_data,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["data"]["reminder_at"] is None
        assert data["data"]["reminder_sent"] is False

        # Verify NO reminder.scheduled event was published
        mock_event_publisher.publish_reminder_scheduled.assert_not_called()


class TestReminderCancellation:
    """Test reminder cancellation when task completed before reminder_at."""

    @pytest.mark.asyncio
    async def test_complete_task_before_reminder_sent(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_user_id: str,
        mock_dapr_client
    ):
        """Test cancelling reminder when task completed before reminder_at time."""
        # Arrange: Create task with future reminder
        due_date = (datetime.utcnow() + timedelta(hours=24)).replace(microsecond=0)
        task_data = {
            "title": "Task with future reminder",
            "due_date": due_date.isoformat() + "Z",
            "reminder_offset_hours": 1
        }
        create_response = await async_client.post(
            f"/api/{test_user_id}/tasks",
            json=task_data,
            headers=auth_headers
        )
        task_id = create_response.json()["data"]["id"]

        # Act: Mark task as complete before reminder_at
        complete_data = {"completed": True}
        response = await async_client.patch(
            f"/api/{test_user_id}/tasks/{task_id}/complete",
            json=complete_data,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["data"]["completed"] is True

        # Verify reminder job was cancelled via Dapr Jobs API
        mock_dapr_client.delete_job.assert_called_once_with(
            f"reminder-task-{task_id}"
        )

    @pytest.mark.asyncio
    async def test_complete_task_after_reminder_sent(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_user_id: str,
        mock_dapr_client,
        db_session
    ):
        """Test that reminder is NOT cancelled if already sent."""
        # Arrange: Create task and manually set reminder_sent=True
        due_date = (datetime.utcnow() + timedelta(hours=24)).replace(microsecond=0)
        reminder_at = due_date - timedelta(hours=1)

        task = Task(
            user_id=test_user_id,
            title="Task with sent reminder",
            due_date=due_date,
            reminder_at=reminder_at,
            reminder_sent=True  # Reminder already sent
        )
        db_session.add(task)
        db_session.commit()
        db_session.refresh(task)

        # Act: Mark task as complete
        complete_data = {"completed": True}
        response = await async_client.patch(
            f"/api/{test_user_id}/tasks/{task.id}/complete",
            json=complete_data,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK

        # Verify reminder job was NOT cancelled (already sent)
        mock_dapr_client.delete_job.assert_not_called()

    @pytest.mark.asyncio
    async def test_complete_task_after_reminder_time_passed(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_user_id: str,
        mock_dapr_client,
        db_session
    ):
        """Test that reminder is NOT cancelled if reminder_at time has passed."""
        # Arrange: Create task with past reminder_at
        due_date = (datetime.utcnow() + timedelta(hours=1)).replace(microsecond=0)
        reminder_at = datetime.utcnow() - timedelta(hours=1)  # Past time

        task = Task(
            user_id=test_user_id,
            title="Task with past reminder",
            due_date=due_date,
            reminder_at=reminder_at,
            reminder_sent=False
        )
        db_session.add(task)
        db_session.commit()
        db_session.refresh(task)

        # Act: Mark task as complete
        complete_data = {"completed": True}
        response = await async_client.patch(
            f"/api/{test_user_id}/tasks/{task.id}/complete",
            json=complete_data,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK

        # Verify reminder job was NOT cancelled (time has passed)
        mock_dapr_client.delete_job.assert_not_called()


class TestReminderEventPublishing:
    """Test event publishing for reminder scheduling."""

    @pytest.mark.asyncio
    async def test_reminder_event_includes_user_email(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_user_id: str,
        mock_event_publisher
    ):
        """Test that reminder.scheduled event includes user_email."""
        # Arrange
        due_date = (datetime.utcnow() + timedelta(hours=24)).replace(microsecond=0)
        task_data = {
            "title": "Email notification test",
            "due_date": due_date.isoformat() + "Z",
            "reminder_offset_hours": 1
        }

        # Act
        response = await async_client.post(
            f"/api/{test_user_id}/tasks",
            json=task_data,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        published_event = mock_event_publisher.publish_reminder_scheduled.call_args[0][0]
        assert published_event.payload.user_email == f"{test_user_id}@example.com"
        assert published_event.payload.notification_type == "email"

    @pytest.mark.asyncio
    async def test_reminder_event_includes_due_date(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        test_user_id: str,
        mock_event_publisher
    ):
        """Test that reminder.scheduled event includes due_date for context."""
        # Arrange
        due_date = (datetime.utcnow() + timedelta(hours=24)).replace(microsecond=0)
        task_data = {
            "title": "Due date context test",
            "description": "Task description",
            "due_date": due_date.isoformat() + "Z",
            "reminder_offset_hours": 2
        }

        # Act
        response = await async_client.post(
            f"/api/{test_user_id}/tasks",
            json=task_data,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        published_event = mock_event_publisher.publish_reminder_scheduled.call_args[0][0]
        assert published_event.payload.due_date == due_date.isoformat() + "Z"
        assert published_event.payload.task_title == "Due date context test"
        assert published_event.payload.task_description == "Task description"


# ==================== Pytest Fixtures ====================

@pytest.fixture
def mock_event_publisher(monkeypatch):
    """Mock EventPublisher for event publishing tests."""
    mock_publisher = MagicMock()
    mock_publisher.publish_reminder_scheduled = AsyncMock()

    def mock_get_event_publisher():
        return mock_publisher

    monkeypatch.setattr(
        "services.task_service.get_event_publisher",
        mock_get_event_publisher
    )
    return mock_publisher


@pytest.fixture
def mock_dapr_client(monkeypatch):
    """Mock DaprClient for job cancellation tests."""
    mock_client = MagicMock()
    mock_client.delete_job = AsyncMock()

    def mock_get_dapr_client():
        return mock_client

    monkeypatch.setattr(
        "services.task_service.get_dapr_client",
        mock_get_dapr_client
    )
    return mock_client


@pytest.fixture
def auth_headers(test_user_id: str):
    """Mock JWT authentication headers."""
    return {
        "Authorization": f"Bearer mock_jwt_token_{test_user_id}"
    }


@pytest.fixture
def test_user_id():
    """Test user ID for user isolation."""
    return "user-test-123"


@pytest.fixture
async def async_client():
    """Async HTTP client for API testing."""
    from httpx import AsyncClient
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
