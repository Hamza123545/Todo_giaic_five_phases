"""
Integration tests for advanced features: export, import, statistics, and bulk operations.

This module tests Phase 5 advanced features with database integration.
"""

import io
import json
from datetime import datetime, timedelta
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from main import app
from models import Task, User
from services.auth_service import AuthService


@pytest.fixture
def test_user(db_session: Session):
    """Create a test user for authentication."""
    auth_service = AuthService()
    user = auth_service.create_user(
        db=db_session,
        email=f"test_{uuid4()}@example.com",
        password="testpassword123",
        name="Test User"
    )
    return user


@pytest.fixture
def auth_token(test_user: User):
    """Generate JWT token for test user."""
    auth_service = AuthService()
    token = auth_service.create_access_token(user_id=test_user.id)
    return token


@pytest.fixture
def test_tasks(db_session: Session, test_user: User):
    """Create test tasks for the user."""
    tasks = []

    # Create tasks with different statuses and priorities
    task1 = Task(
        user_id=test_user.id,
        title="Completed Task 1",
        description="First completed task",
        priority="high",
        due_date=datetime.utcnow() + timedelta(days=7),
        tags=["work", "important"],
        completed=True
    )
    tasks.append(task1)

    task2 = Task(
        user_id=test_user.id,
        title="Pending Task 1",
        description="First pending task",
        priority="medium",
        due_date=datetime.utcnow() + timedelta(days=3),
        tags=["personal"],
        completed=False
    )
    tasks.append(task2)

    task3 = Task(
        user_id=test_user.id,
        title="Overdue Task",
        description="Task past due date",
        priority="high",
        due_date=datetime.utcnow() - timedelta(days=2),  # Overdue
        tags=["urgent"],
        completed=False
    )
    tasks.append(task3)

    task4 = Task(
        user_id=test_user.id,
        title="Low Priority Task",
        description="Not urgent",
        priority="low",
        completed=False
    )
    tasks.append(task4)

    for task in tasks:
        db_session.add(task)

    db_session.commit()

    for task in tasks:
        db_session.refresh(task)

    return tasks


class TestExportEndpoint:
    """Tests for the export endpoint."""

    def test_export_csv_format(self, test_user: User, test_tasks: list[Task], auth_token: str):
        """Test exporting tasks to CSV format."""
        client = TestClient(app)

        response = client.get(
            f"/api/{test_user.id}/tasks/export?format=csv",
            headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"
        assert "attachment" in response.headers["content-disposition"]

        # Verify CSV content
        csv_content = response.text
        assert "id,user_id,title,description,priority" in csv_content
        assert "Completed Task 1" in csv_content
        assert "Pending Task 1" in csv_content
        assert "Overdue Task" in csv_content

    def test_export_json_format(self, test_user: User, test_tasks: list[Task], auth_token: str):
        """Test exporting tasks to JSON format."""
        client = TestClient(app)

        response = client.get(
            f"/api/{test_user.id}/tasks/export?format=json",
            headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"
        assert "attachment" in response.headers["content-disposition"]

        # Verify JSON content
        tasks_data = json.loads(response.text)
        assert isinstance(tasks_data, list)
        assert len(tasks_data) == 4

        # Check task structure
        task = tasks_data[0]
        assert "id" in task
        assert "title" in task
        assert "priority" in task
        assert "completed" in task

    def test_export_invalid_format(self, test_user: User, auth_token: str):
        """Test export with invalid format parameter."""
        client = TestClient(app)

        response = client.get(
            f"/api/{test_user.id}/tasks/export?format=xml",
            headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert response.status_code == 400

    def test_export_unauthorized(self, test_user: User):
        """Test export without authentication."""
        client = TestClient(app)

        response = client.get(f"/api/{test_user.id}/tasks/export?format=csv")

        assert response.status_code == 401


class TestImportEndpoint:
    """Tests for the import endpoint."""

    def test_import_csv_valid(self, test_user: User, auth_token: str):
        """Test importing tasks from valid CSV file."""
        client = TestClient(app)

        # Create CSV content
        csv_content = """title,description,priority,due_date,tags,completed
Task 1,Description 1,high,2024-12-31T23:59:59,work,false
Task 2,Description 2,medium,2024-12-30T23:59:59,personal,false
"""

        # Create file upload
        files = {
            'file': ('tasks.csv', io.BytesIO(csv_content.encode('utf-8')), 'text/csv')
        }

        response = client.post(
            f"/api/{test_user.id}/tasks/import",
            headers={"Authorization": f"Bearer {auth_token}"},
            files=files
        )

        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["data"]["imported"] == 2
        assert data["data"]["errors"] == 0

    def test_import_json_valid(self, test_user: User, auth_token: str):
        """Test importing tasks from valid JSON file."""
        client = TestClient(app)

        # Create JSON content
        json_content = json.dumps([
            {
                "title": "JSON Task 1",
                "description": "First JSON task",
                "priority": "high",
                "due_date": "2024-12-31T23:59:59",
                "tags": ["work", "important"],
                "completed": False
            },
            {
                "title": "JSON Task 2",
                "description": "Second JSON task",
                "priority": "low",
                "completed": False
            }
        ])

        # Create file upload
        files = {
            'file': ('tasks.json', io.BytesIO(json_content.encode('utf-8')), 'application/json')
        }

        response = client.post(
            f"/api/{test_user.id}/tasks/import",
            headers={"Authorization": f"Bearer {auth_token}"},
            files=files
        )

        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["data"]["imported"] == 2
        assert data["data"]["errors"] == 0

    def test_import_with_validation_errors(self, test_user: User, auth_token: str):
        """Test importing with validation errors."""
        client = TestClient(app)

        # Create CSV with validation errors (missing title, invalid priority)
        csv_content = """title,description,priority,due_date,tags,completed
,No title task,high,2024-12-31T23:59:59,work,false
Valid Task,Description,invalid_priority,2024-12-31T23:59:59,work,false
"""

        files = {
            'file': ('tasks.csv', io.BytesIO(csv_content.encode('utf-8')), 'text/csv')
        }

        response = client.post(
            f"/api/{test_user.id}/tasks/import",
            headers={"Authorization": f"Bearer {auth_token}"},
            files=files
        )

        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        # Should have errors for invalid rows
        assert data["data"]["errors"] > 0
        assert data["data"]["errors_list"] is not None

    def test_import_invalid_file_format(self, test_user: User, auth_token: str):
        """Test importing with invalid file format."""
        client = TestClient(app)

        # Create XML file (invalid format)
        xml_content = "<tasks><task>Test</task></tasks>"

        files = {
            'file': ('tasks.xml', io.BytesIO(xml_content.encode('utf-8')), 'application/xml')
        }

        response = client.post(
            f"/api/{test_user.id}/tasks/import",
            headers={"Authorization": f"Bearer {auth_token}"},
            files=files
        )

        assert response.status_code == 400

    def test_import_unauthorized(self, test_user: User):
        """Test import without authentication."""
        client = TestClient(app)

        csv_content = "title,description\nTask 1,Description 1"
        files = {
            'file': ('tasks.csv', io.BytesIO(csv_content.encode('utf-8')), 'text/csv')
        }

        response = client.post(
            f"/api/{test_user.id}/tasks/import",
            files=files
        )

        assert response.status_code == 401


class TestStatisticsEndpoint:
    """Tests for the statistics endpoint."""

    def test_statistics_calculation(self, test_user: User, test_tasks: list[Task], auth_token: str):
        """Test statistics calculation with various task states."""
        client = TestClient(app)

        response = client.get(
            f"/api/{test_user.id}/tasks/statistics",
            headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert "data" in data

        stats = data["data"]
        assert stats["total"] == 4
        assert stats["completed"] == 1
        assert stats["pending"] == 3
        assert stats["overdue"] == 1  # One task is overdue

    def test_statistics_empty_tasks(self, test_user: User, auth_token: str, db_session: Session):
        """Test statistics with no tasks."""
        client = TestClient(app)

        response = client.get(
            f"/api/{test_user.id}/tasks/statistics",
            headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert response.status_code == 200

        data = response.json()
        stats = data["data"]
        assert stats["total"] == 4  # From test_tasks fixture
        assert stats["completed"] >= 0
        assert stats["pending"] >= 0
        assert stats["overdue"] >= 0

    def test_statistics_unauthorized(self, test_user: User):
        """Test statistics without authentication."""
        client = TestClient(app)

        response = client.get(f"/api/{test_user.id}/tasks/statistics")

        assert response.status_code == 401


class TestBulkOperations:
    """Tests for bulk operations endpoint."""

    def test_bulk_delete(self, test_user: User, test_tasks: list[Task], auth_token: str):
        """Test bulk delete operation."""
        client = TestClient(app)

        task_ids = [test_tasks[0].id, test_tasks[1].id]

        response = client.post(
            f"/api/{test_user.id}/tasks/bulk",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "action": "delete",
                "task_ids": task_ids
            }
        )

        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["data"]["affected"] == 2

        # Verify tasks are deleted
        verify_response = client.get(
            f"/api/{test_user.id}/tasks",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        remaining_tasks = verify_response.json()["data"]
        assert len(remaining_tasks) == 2

    def test_bulk_complete(self, test_user: User, test_tasks: list[Task], auth_token: str):
        """Test bulk complete operation."""
        client = TestClient(app)

        # Get pending tasks
        pending_task_ids = [task.id for task in test_tasks if not task.completed]

        response = client.post(
            f"/api/{test_user.id}/tasks/bulk",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "action": "complete",
                "task_ids": pending_task_ids
            }
        )

        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["data"]["affected"] == len(pending_task_ids)

        # Verify tasks are completed
        for task_id in pending_task_ids:
            task_response = client.get(
                f"/api/{test_user.id}/tasks/{task_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            task_data = task_response.json()["data"]
            assert task_data["completed"] is True

    def test_bulk_pending(self, test_user: User, test_tasks: list[Task], auth_token: str):
        """Test bulk pending operation."""
        client = TestClient(app)

        # Get completed tasks
        completed_task_ids = [task.id for task in test_tasks if task.completed]

        response = client.post(
            f"/api/{test_user.id}/tasks/bulk",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "action": "pending",
                "task_ids": completed_task_ids
            }
        )

        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["data"]["affected"] == len(completed_task_ids)

        # Verify tasks are pending
        for task_id in completed_task_ids:
            task_response = client.get(
                f"/api/{test_user.id}/tasks/{task_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            task_data = task_response.json()["data"]
            assert task_data["completed"] is False

    def test_bulk_priority_change(self, test_user: User, test_tasks: list[Task], auth_token: str):
        """Test bulk priority change operation."""
        client = TestClient(app)

        task_ids = [test_tasks[0].id, test_tasks[1].id]

        response = client.post(
            f"/api/{test_user.id}/tasks/bulk",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "action": "priority",
                "task_ids": task_ids,
                "priority": "high"
            }
        )

        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["data"]["affected"] == 2

        # Verify priority changed
        for task_id in task_ids:
            task_response = client.get(
                f"/api/{test_user.id}/tasks/{task_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            task_data = task_response.json()["data"]
            assert task_data["priority"] == "high"

    def test_bulk_invalid_action(self, test_user: User, test_tasks: list[Task], auth_token: str):
        """Test bulk operation with invalid action."""
        client = TestClient(app)

        response = client.post(
            f"/api/{test_user.id}/tasks/bulk",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "action": "invalid_action",
                "task_ids": [test_tasks[0].id]
            }
        )

        assert response.status_code == 422  # Validation error

    def test_bulk_task_not_found(self, test_user: User, auth_token: str):
        """Test bulk operation with non-existent task ID."""
        client = TestClient(app)

        response = client.post(
            f"/api/{test_user.id}/tasks/bulk",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "action": "delete",
                "task_ids": [99999]  # Non-existent task
            }
        )

        assert response.status_code == 404

    def test_bulk_transaction_rollback(self, test_user: User, test_tasks: list[Task], auth_token: str):
        """Test that bulk operations use transactions and rollback on error."""
        client = TestClient(app)

        # Mix valid and invalid task IDs
        task_ids = [test_tasks[0].id, 99999]

        response = client.post(
            f"/api/{test_user.id}/tasks/bulk",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "action": "delete",
                "task_ids": task_ids
            }
        )

        # Should fail due to invalid task ID
        assert response.status_code == 404

        # Verify first task was NOT deleted (transaction rolled back)
        task_response = client.get(
            f"/api/{test_user.id}/tasks/{test_tasks[0].id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert task_response.status_code == 200

    def test_bulk_priority_missing_priority_param(self, test_user: User, test_tasks: list[Task], auth_token: str):
        """Test bulk priority change without priority parameter."""
        client = TestClient(app)

        response = client.post(
            f"/api/{test_user.id}/tasks/bulk",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "action": "priority",
                "task_ids": [test_tasks[0].id]
                # Missing priority parameter
            }
        )

        assert response.status_code == 422  # Validation error

    def test_bulk_unauthorized(self, test_user: User, test_tasks: list[Task]):
        """Test bulk operations without authentication."""
        client = TestClient(app)

        response = client.post(
            f"/api/{test_user.id}/tasks/bulk",
            json={
                "action": "delete",
                "task_ids": [test_tasks[0].id]
            }
        )

        assert response.status_code == 401
