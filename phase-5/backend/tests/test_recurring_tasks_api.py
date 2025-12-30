"""
API Tests for Recurring Tasks - Phase V

Tests task creation, update, and completion with recurring_pattern and next_occurrence.
Covers: T061 from tasks.md
"""

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool

from main import app
from db import get_session
from models import Task


# ==================== Test Database Setup ====================

@pytest.fixture(name="session")
def session_fixture():
    """Create test database session."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create test client with mocked authentication."""
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override

    # Mock JWT verification to return test user
    def mock_verify_jwt():
        return {"user_id": "test-user-123", "email": "test@example.com"}

    from middleware.jwt import verify_jwt_token
    app.dependency_overrides[verify_jwt_token] = mock_verify_jwt

    client = TestClient(app)
    yield client

    app.dependency_overrides.clear()


# ==================== Task Creation Tests ====================

class TestRecurringTaskCreation:
    """Test recurring task creation with RRULE patterns - T061"""

    def test_create_task_with_daily_pattern(self, client: TestClient, session: Session):
        """Test creating a task with DAILY recurring pattern."""
        task_data = {
            "title": "Daily standup",
            "description": "Daily standup meeting at 10 AM",
            "priority": "medium",
            "due_date": "2025-12-30T10:00:00Z",
            "recurring_pattern": "DAILY",
            "recurring_end_date": None
        }

        response = client.post("/api/test-user-123/tasks", json=task_data)

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["title"] == "Daily standup"
        assert data["data"]["recurring_pattern"] == "DAILY"
        assert data["data"]["next_occurrence"] is not None
        # Next occurrence should be Dec 31, 2025 (1 day after due_date)
        next_occ = datetime.fromisoformat(data["data"]["next_occurrence"].replace("Z", ""))
        assert next_occ.date() == datetime(2025, 12, 31).date()

    def test_create_task_with_weekly_pattern(self, client: TestClient, session: Session):
        """Test creating a task with WEEKLY recurring pattern."""
        task_data = {
            "title": "Weekly team meeting",
            "description": "Weekly team sync meeting",
            "priority": "high",
            "due_date": "2025-12-30T14:00:00Z",
            "recurring_pattern": "WEEKLY",
            "recurring_end_date": "2026-03-31T23:59:59Z"
        }

        response = client.post("/api/test-user-123/tasks", json=task_data)

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["recurring_pattern"] == "WEEKLY"
        assert data["data"]["recurring_end_date"] is not None
        assert data["data"]["next_occurrence"] is not None
        # Next occurrence should be 1 week later (Jan 6, 2026)
        next_occ = datetime.fromisoformat(data["data"]["next_occurrence"].replace("Z", ""))
        assert next_occ.date() == datetime(2026, 1, 6).date()

    def test_create_task_with_monthly_pattern(self, client: TestClient, session: Session):
        """Test creating a task with MONTHLY recurring pattern."""
        task_data = {
            "title": "Monthly expense report",
            "description": "Submit monthly expense report",
            "priority": "medium",
            "due_date": "2025-12-30T17:00:00Z",
            "recurring_pattern": "MONTHLY"
        }

        response = client.post("/api/test-user-123/tasks", json=task_data)

        assert response.status_code == 201
        data = response.json()
        assert data["data"]["recurring_pattern"] == "MONTHLY"
        assert data["data"]["next_occurrence"] is not None
        # Next occurrence should be 1 month later (Jan 30, 2026)
        next_occ = datetime.fromisoformat(data["data"]["next_occurrence"].replace("Z", ""))
        assert next_occ.month == 1
        assert next_occ.year == 2026

    def test_create_task_with_yearly_pattern(self, client: TestClient, session: Session):
        """Test creating a task with YEARLY recurring pattern."""
        task_data = {
            "title": "Annual tax filing",
            "description": "File annual tax return",
            "priority": "high",
            "due_date": "2025-04-15T23:59:59Z",
            "recurring_pattern": "YEARLY"
        }

        response = client.post("/api/test-user-123/tasks", json=task_data)

        assert response.status_code == 201
        data = response.json()
        assert data["data"]["recurring_pattern"] == "YEARLY"
        assert data["data"]["next_occurrence"] is not None
        # Next occurrence should be 1 year later (Apr 15, 2026)
        next_occ = datetime.fromisoformat(data["data"]["next_occurrence"].replace("Z", ""))
        assert next_occ.year == 2026
        assert next_occ.month == 4
        assert next_occ.day == 15

    def test_create_task_with_full_rrule_pattern(self, client: TestClient, session: Session):
        """Test creating a task with full RFC 5545 RRULE pattern."""
        task_data = {
            "title": "Bi-weekly sprint planning",
            "description": "Sprint planning every 2 weeks",
            "priority": "high",
            "due_date": "2025-12-30T09:00:00Z",
            "recurring_pattern": "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO"
        }

        response = client.post("/api/test-user-123/tasks", json=task_data)

        assert response.status_code == 201
        data = response.json()
        assert data["data"]["recurring_pattern"] == "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO"
        assert data["data"]["next_occurrence"] is not None

    def test_create_task_with_invalid_rrule_pattern(self, client: TestClient, session: Session):
        """Test creating a task with invalid RRULE pattern returns error."""
        task_data = {
            "title": "Invalid recurring task",
            "description": "Task with invalid pattern",
            "priority": "medium",
            "due_date": "2025-12-30T10:00:00Z",
            "recurring_pattern": "INVALID_PATTERN_123"
        }

        response = client.post("/api/test-user-123/tasks", json=task_data)

        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "INVALID_RECURRING_PATTERN" in data["error"]["code"]

    def test_create_non_recurring_task(self, client: TestClient, session: Session):
        """Test creating a non-recurring task (no recurring_pattern)."""
        task_data = {
            "title": "Buy groceries",
            "description": "One-time grocery shopping",
            "priority": "low",
            "due_date": "2025-12-31T18:00:00Z"
        }

        response = client.post("/api/test-user-123/tasks", json=task_data)

        assert response.status_code == 201
        data = response.json()
        assert data["data"]["recurring_pattern"] is None
        assert data["data"]["next_occurrence"] is None
        assert data["data"]["recurring_end_date"] is None


# ==================== Task Update Tests ====================

class TestRecurringTaskUpdate:
    """Test updating recurring tasks - T061"""

    def test_update_recurring_pattern(self, client: TestClient, session: Session):
        """Test updating recurring_pattern recalculates next_occurrence."""
        # Create initial task with DAILY pattern
        task_data = {
            "title": "Update test task",
            "due_date": "2025-12-30T10:00:00Z",
            "recurring_pattern": "DAILY"
        }
        create_response = client.post("/api/test-user-123/tasks", json=task_data)
        task_id = create_response.json()["data"]["id"]

        # Update to WEEKLY pattern
        update_data = {
            "recurring_pattern": "WEEKLY"
        }
        response = client.put(f"/api/test-user-123/tasks/{task_id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["recurring_pattern"] == "WEEKLY"
        # Next occurrence should be 1 week later (Jan 6, 2026)
        next_occ = datetime.fromisoformat(data["data"]["next_occurrence"].replace("Z", ""))
        assert next_occ.date() == datetime(2026, 1, 6).date()

    def test_update_due_date_recalculates_next_occurrence(self, client: TestClient, session: Session):
        """Test updating due_date recalculates next_occurrence for recurring tasks."""
        # Create recurring task
        task_data = {
            "title": "Recurring task",
            "due_date": "2025-12-30T10:00:00Z",
            "recurring_pattern": "DAILY"
        }
        create_response = client.post("/api/test-user-123/tasks", json=task_data)
        task_id = create_response.json()["data"]["id"]

        # Update due_date
        update_data = {
            "due_date": "2026-01-05T10:00:00Z"
        }
        response = client.put(f"/api/test-user-123/tasks/{task_id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        # Next occurrence should be 1 day after new due_date (Jan 6, 2026)
        next_occ = datetime.fromisoformat(data["data"]["next_occurrence"].replace("Z", ""))
        assert next_occ.date() == datetime(2026, 1, 6).date()

    def test_update_recurring_end_date(self, client: TestClient, session: Session):
        """Test updating recurring_end_date."""
        # Create recurring task with end date
        task_data = {
            "title": "Limited recurring task",
            "due_date": "2025-12-30T10:00:00Z",
            "recurring_pattern": "DAILY",
            "recurring_end_date": "2026-01-31T23:59:59Z"
        }
        create_response = client.post("/api/test-user-123/tasks", json=task_data)
        task_id = create_response.json()["data"]["id"]

        # Update end date to earlier
        update_data = {
            "recurring_end_date": "2026-01-15T23:59:59Z"
        }
        response = client.put(f"/api/test-user-123/tasks/{task_id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["recurring_end_date"] is not None


# ==================== Task Completion Tests ====================

class TestRecurringTaskCompletion:
    """Test task.completed event publishing - T061"""

    @patch("services.task_service.get_dapr_client")
    def test_complete_recurring_task_publishes_event(self, mock_dapr, client: TestClient, session: Session):
        """Test completing recurring task publishes task.completed event."""
        # Mock Dapr client
        mock_dapr_instance = AsyncMock()
        mock_dapr.return_value = mock_dapr_instance

        # Create recurring task
        task_data = {
            "title": "Daily standup",
            "due_date": "2025-12-30T10:00:00Z",
            "recurring_pattern": "DAILY"
        }
        create_response = client.post("/api/test-user-123/tasks", json=task_data)
        task_id = create_response.json()["data"]["id"]

        # Mark as complete
        response = client.patch(
            f"/api/test-user-123/tasks/{task_id}/complete",
            json={"completed": True}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["completed"] is True
        assert data["data"]["completed_at"] is not None

        # Verify Dapr publish_event was called
        mock_dapr_instance.publish_event.assert_called_once()
        call_args = mock_dapr_instance.publish_event.call_args

        # Verify event data
        assert call_args[1]["topic"] == "task-events"
        event_data = call_args[1]["event_data"]
        assert event_data["event_type"] == "task.completed"
        assert event_data["task_id"] == task_id
        assert event_data["user_id"] == "test-user-123"
        assert event_data["payload"]["task_title"] == "Daily standup"
        assert event_data["payload"]["recurring_pattern"] == "DAILY"

    @patch("services.task_service.get_dapr_client")
    def test_complete_non_recurring_task_no_event(self, mock_dapr, client: TestClient, session: Session):
        """Test completing non-recurring task does not publish event."""
        # Mock Dapr client
        mock_dapr_instance = AsyncMock()
        mock_dapr.return_value = mock_dapr_instance

        # Create non-recurring task
        task_data = {
            "title": "One-time task",
            "due_date": "2025-12-30T10:00:00Z"
        }
        create_response = client.post("/api/test-user-123/tasks", json=task_data)
        task_id = create_response.json()["data"]["id"]

        # Mark as complete
        response = client.patch(
            f"/api/test-user-123/tasks/{task_id}/complete",
            json={"completed": True}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["completed"] is True

        # Verify Dapr publish_event was NOT called (non-recurring)
        mock_dapr_instance.publish_event.assert_not_called()

    @patch("services.task_service.get_dapr_client")
    def test_mark_as_incomplete_clears_completed_at(self, mock_dapr, client: TestClient, session: Session):
        """Test marking recurring task as incomplete clears completed_at."""
        # Mock Dapr client
        mock_dapr_instance = AsyncMock()
        mock_dapr.return_value = mock_dapr_instance

        # Create and complete recurring task
        task_data = {
            "title": "Recurring task",
            "recurring_pattern": "DAILY"
        }
        create_response = client.post("/api/test-user-123/tasks", json=task_data)
        task_id = create_response.json()["data"]["id"]

        # Mark as complete
        client.patch(
            f"/api/test-user-123/tasks/{task_id}/complete",
            json={"completed": True}
        )

        # Mark as incomplete
        response = client.patch(
            f"/api/test-user-123/tasks/{task_id}/complete",
            json={"completed": False}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["completed"] is False
        assert data["data"]["completed_at"] is None


# ==================== Task Retrieval Tests ====================

class TestRecurringTaskRetrieval:
    """Test retrieving recurring tasks with all fields - T061"""

    def test_get_task_includes_recurring_fields(self, client: TestClient, session: Session):
        """Test getting a single recurring task includes all Phase V fields."""
        # Create recurring task
        task_data = {
            "title": "Recurring task",
            "recurring_pattern": "DAILY",
            "recurring_end_date": "2026-12-31T23:59:59Z"
        }
        create_response = client.post("/api/test-user-123/tasks", json=task_data)
        task_id = create_response.json()["data"]["id"]

        # Get task
        response = client.get(f"/api/test-user-123/tasks/{task_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["recurring_pattern"] == "DAILY"
        assert data["data"]["recurring_end_date"] is not None
        assert data["data"]["next_occurrence"] is not None
        assert data["data"]["completed_at"] is None
        assert data["data"]["reminder_at"] is None
        assert data["data"]["reminder_sent"] is False

    def test_list_tasks_includes_recurring_fields(self, client: TestClient, session: Session):
        """Test listing tasks includes recurring fields."""
        # Create recurring and non-recurring tasks
        client.post("/api/test-user-123/tasks", json={
            "title": "Recurring task",
            "recurring_pattern": "DAILY"
        })
        client.post("/api/test-user-123/tasks", json={
            "title": "Non-recurring task"
        })

        # List tasks
        response = client.get("/api/test-user-123/tasks")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]["items"]) == 2

        # Check recurring task has fields
        recurring_task = next(t for t in data["data"]["items"] if t["title"] == "Recurring task")
        assert recurring_task["recurring_pattern"] == "DAILY"
        assert recurring_task["next_occurrence"] is not None

        # Check non-recurring task has null fields
        non_recurring_task = next(t for t in data["data"]["items"] if t["title"] == "Non-recurring task")
        assert non_recurring_task["recurring_pattern"] is None
        assert non_recurring_task["next_occurrence"] is None
