"""
Integration tests for advanced features: export, import, statistics, bulk operations.

This module tests the advanced task management features with real database operations.
"""

import csv
import io
import json
from datetime import datetime, timedelta

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlmodel import Session

from models import Task, User


@pytest.fixture
def sample_tasks(db_session: Session, test_user: User) -> list[Task]:
    """Create sample tasks for testing."""
    tasks = [
        Task(
            user_id=test_user.id,
            title="Task 1 - Low Priority",
            description="Description 1",
            priority="low",
            completed=False,
            due_date=datetime.now() + timedelta(days=5),
            tags=["work", "urgent"],
        ),
        Task(
            user_id=test_user.id,
            title="Task 2 - Medium Priority",
            description="Description 2",
            priority="medium",
            completed=True,
            due_date=datetime.now() + timedelta(days=3),
            tags=["personal"],
        ),
        Task(
            user_id=test_user.id,
            title="Task 3 - High Priority",
            description="Description 3",
            priority="high",
            completed=False,
            due_date=datetime.now() - timedelta(days=2),  # Overdue
            tags=["work"],
        ),
        Task(
            user_id=test_user.id,
            title="Task 4 - Completed",
            description="Description 4",
            priority="medium",
            completed=True,
            tags=["home"],
        ),
    ]

    for task in tasks:
        db_session.add(task)
    db_session.commit()

    for task in tasks:
        db_session.refresh(task)

    return tasks


# ============================================================================
# EXPORT TESTS
# ============================================================================


def test_export_csv_success(
    client: TestClient, test_user: User, auth_headers: dict, sample_tasks: list[Task]
):
    """Test successful CSV export of tasks."""
    response = client.get(
        f"/api/{test_user.id}/tasks/export?format=csv", headers=auth_headers
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert "Content-Disposition" in response.headers
    assert "tasks_export" in response.headers["Content-Disposition"]
    assert ".csv" in response.headers["Content-Disposition"]

    # Parse CSV content
    csv_content = response.text
    reader = csv.DictReader(io.StringIO(csv_content))
    rows = list(reader)

    assert len(rows) == 4
    assert all("title" in row for row in rows)
    assert all("priority" in row for row in rows)


def test_export_json_success(
    client: TestClient, test_user: User, auth_headers: dict, sample_tasks: list[Task]
):
    """Test successful JSON export of tasks."""
    response = client.get(
        f"/api/{test_user.id}/tasks/export?format=json", headers=auth_headers
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["content-type"] == "application/json"
    assert "Content-Disposition" in response.headers
    assert "tasks_export" in response.headers["Content-Disposition"]
    assert ".json" in response.headers["Content-Disposition"]

    # Parse JSON content
    json_data = response.json()
    assert isinstance(json_data, list)
    assert len(json_data) == 4
    assert all("title" in task for task in json_data)
    assert all("priority" in task for task in json_data)


def test_export_invalid_format(client: TestClient, test_user: User, auth_headers: dict):
    """Test export with invalid format."""
    response = client.get(
        f"/api/{test_user.id}/tasks/export?format=xml", headers=auth_headers
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_export_unauthorized(client: TestClient, test_user: User):
    """Test export without authentication."""
    response = client.get(f"/api/{test_user.id}/tasks/export?format=csv")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_export_wrong_user(
    client: TestClient, test_user: User, other_user: User, auth_headers: dict
):
    """Test export with mismatched user_id."""
    response = client.get(
        f"/api/{other_user.id}/tasks/export?format=csv", headers=auth_headers
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


# ============================================================================
# IMPORT TESTS
# ============================================================================


def test_import_csv_success(
    client: TestClient, test_user: User, auth_headers: dict, db_session: Session
):
    """Test successful CSV import of tasks."""
    csv_content = """title,description,priority,due_date,tags,completed
Import Task 1,Import Description 1,low,2025-12-31,work|urgent,false
Import Task 2,Import Description 2,high,2025-12-25,personal,true"""

    files = {"file": ("tasks.csv", csv_content, "text/csv")}
    response = client.post(
        f"/api/{test_user.id}/tasks/import", headers=auth_headers, files=files
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["success"] is True
    assert data["data"]["imported"] == 2
    assert data["data"]["errors"] == 0


def test_import_json_success(
    client: TestClient, test_user: User, auth_headers: dict, db_session: Session
):
    """Test successful JSON import of tasks."""
    json_content = json.dumps(
        [
            {
                "title": "Import Task 1",
                "description": "Import Description 1",
                "priority": "medium",
                "due_date": "2025-12-31",
                "tags": ["work"],
                "completed": False,
            },
            {
                "title": "Import Task 2",
                "description": "Import Description 2",
                "priority": "high",
                "tags": ["personal"],
                "completed": True,
            },
        ]
    )

    files = {"file": ("tasks.json", json_content, "application/json")}
    response = client.post(
        f"/api/{test_user.id}/tasks/import", headers=auth_headers, files=files
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["success"] is True
    assert data["data"]["imported"] == 2
    assert data["data"]["errors"] == 0


def test_import_csv_with_errors(
    client: TestClient, test_user: User, auth_headers: dict
):
    """Test CSV import with validation errors."""
    csv_content = """title,description,priority,due_date,tags,completed
Valid Task,Description,medium,2025-12-31,work,false
,Missing Title,low,,,false
Too Long Title """ + ("X" * 250) + """,Description,high,,,false"""

    files = {"file": ("tasks.csv", csv_content, "text/csv")}
    response = client.post(
        f"/api/{test_user.id}/tasks/import", headers=auth_headers, files=files
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["success"] is True
    assert data["data"]["imported"] >= 1
    assert data["data"]["errors"] >= 1
    assert data["data"]["errors_list"] is not None


def test_import_invalid_file_type(
    client: TestClient, test_user: User, auth_headers: dict
):
    """Test import with invalid file type."""
    files = {"file": ("tasks.txt", "invalid content", "text/plain")}
    response = client.post(
        f"/api/{test_user.id}/tasks/import", headers=auth_headers, files=files
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_import_unauthorized(client: TestClient, test_user: User):
    """Test import without authentication."""
    files = {"file": ("tasks.csv", "title\nTask", "text/csv")}
    response = client.post(f"/api/{test_user.id}/tasks/import", files=files)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================================
# STATISTICS TESTS
# ============================================================================


def test_get_statistics_success(
    client: TestClient, test_user: User, auth_headers: dict, sample_tasks: list[Task]
):
    """Test successful retrieval of task statistics."""
    response = client.get(
        f"/api/{test_user.id}/tasks/statistics", headers=auth_headers
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["success"] is True

    stats = data["data"]
    assert "total" in stats
    assert "completed" in stats
    assert "pending" in stats
    assert "overdue" in stats
    assert "by_priority" in stats

    assert stats["total"] == 4
    assert stats["completed"] == 2
    assert stats["pending"] == 2
    assert stats["overdue"] == 1  # Task 3 is overdue

    assert "low" in stats["by_priority"]
    assert "medium" in stats["by_priority"]
    assert "high" in stats["by_priority"]


def test_get_statistics_empty(
    client: TestClient, test_user: User, auth_headers: dict
):
    """Test statistics with no tasks."""
    response = client.get(
        f"/api/{test_user.id}/tasks/statistics", headers=auth_headers
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["success"] is True

    stats = data["data"]
    assert stats["total"] == 0
    assert stats["completed"] == 0
    assert stats["pending"] == 0
    assert stats["overdue"] == 0


def test_get_statistics_unauthorized(client: TestClient, test_user: User):
    """Test statistics without authentication."""
    response = client.get(f"/api/{test_user.id}/tasks/statistics")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_statistics_wrong_user(
    client: TestClient, test_user: User, other_user: User, auth_headers: dict
):
    """Test statistics with mismatched user_id."""
    response = client.get(
        f"/api/{other_user.id}/tasks/statistics", headers=auth_headers
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


# ============================================================================
# BULK OPERATIONS TESTS
# ============================================================================


def test_bulk_delete_success(
    client: TestClient,
    test_user: User,
    auth_headers: dict,
    sample_tasks: list[Task],
    db_session: Session,
):
    """Test successful bulk delete operation."""
    task_ids = [sample_tasks[0].id, sample_tasks[1].id]

    response = client.post(
        f"/api/{test_user.id}/tasks/bulk?operation=delete&task_ids={task_ids[0]}&task_ids={task_ids[1]}",
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["success"] is True
    assert data["data"]["success"] == 2
    assert data["data"]["failed"] == 0


def test_bulk_complete_success(
    client: TestClient,
    test_user: User,
    auth_headers: dict,
    sample_tasks: list[Task],
    db_session: Session,
):
    """Test successful bulk complete operation."""
    task_ids = [sample_tasks[0].id, sample_tasks[2].id]

    response = client.post(
        f"/api/{test_user.id}/tasks/bulk?operation=complete&task_ids={task_ids[0]}&task_ids={task_ids[1]}",
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["success"] is True
    assert data["data"]["success"] == 2

    # Verify tasks are completed
    db_session.refresh(sample_tasks[0])
    db_session.refresh(sample_tasks[2])
    assert sample_tasks[0].completed is True
    assert sample_tasks[2].completed is True


def test_bulk_pending_success(
    client: TestClient,
    test_user: User,
    auth_headers: dict,
    sample_tasks: list[Task],
    db_session: Session,
):
    """Test successful bulk pending operation."""
    task_ids = [sample_tasks[1].id, sample_tasks[3].id]

    response = client.post(
        f"/api/{test_user.id}/tasks/bulk?operation=pending&task_ids={task_ids[0]}&task_ids={task_ids[1]}",
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["success"] is True
    assert data["data"]["success"] == 2

    # Verify tasks are pending
    db_session.refresh(sample_tasks[1])
    db_session.refresh(sample_tasks[3])
    assert sample_tasks[1].completed is False
    assert sample_tasks[3].completed is False


def test_bulk_priority_change_success(
    client: TestClient,
    test_user: User,
    auth_headers: dict,
    sample_tasks: list[Task],
    db_session: Session,
):
    """Test successful bulk priority change operation."""
    task_ids = [sample_tasks[0].id, sample_tasks[1].id]

    response = client.post(
        f"/api/{test_user.id}/tasks/bulk?operation=priority_high&task_ids={task_ids[0]}&task_ids={task_ids[1]}",
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["success"] is True
    assert data["data"]["success"] == 2

    # Verify priority changed
    db_session.refresh(sample_tasks[0])
    db_session.refresh(sample_tasks[1])
    assert sample_tasks[0].priority == "high"
    assert sample_tasks[1].priority == "high"


def test_bulk_operation_empty_task_ids(
    client: TestClient, test_user: User, auth_headers: dict
):
    """Test bulk operation with empty task_ids."""
    response = client.post(
        f"/api/{test_user.id}/tasks/bulk?operation=delete", headers=auth_headers
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_bulk_operation_invalid_operation(
    client: TestClient, test_user: User, auth_headers: dict, sample_tasks: list[Task]
):
    """Test bulk operation with invalid operation type."""
    response = client.post(
        f"/api/{test_user.id}/tasks/bulk?operation=invalid&task_ids={sample_tasks[0].id}",
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_bulk_operation_other_user_tasks(
    client: TestClient,
    test_user: User,
    other_user: User,
    auth_headers: dict,
    db_session: Session,
):
    """Test bulk operation on tasks belonging to another user."""
    # Create task for other user
    other_task = Task(
        user_id=other_user.id,
        title="Other User Task",
        description="Description",
        priority="medium",
        completed=False,
    )
    db_session.add(other_task)
    db_session.commit()
    db_session.refresh(other_task)

    response = client.post(
        f"/api/{test_user.id}/tasks/bulk?operation=delete&task_ids={other_task.id}",
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    # Should fail because task doesn't belong to user
    assert data["data"]["success"] == 0
    assert data["data"]["failed"] == 1


def test_bulk_operation_unauthorized(client: TestClient, test_user: User):
    """Test bulk operation without authentication."""
    response = client.post(
        f"/api/{test_user.id}/tasks/bulk?operation=delete&task_ids=1"
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================================
# INTEGRATION TESTS
# ============================================================================


def test_export_import_roundtrip_csv(
    client: TestClient, test_user: User, auth_headers: dict, sample_tasks: list[Task]
):
    """Test export followed by import (CSV roundtrip)."""
    # Export tasks
    export_response = client.get(
        f"/api/{test_user.id}/tasks/export?format=csv", headers=auth_headers
    )
    assert export_response.status_code == status.HTTP_200_OK
    csv_content = export_response.text

    # Delete all tasks
    for task in sample_tasks:
        client.delete(
            f"/api/{test_user.id}/tasks/{task.id}", headers=auth_headers
        )

    # Import tasks back
    files = {"file": ("tasks.csv", csv_content, "text/csv")}
    import_response = client.post(
        f"/api/{test_user.id}/tasks/import", headers=auth_headers, files=files
    )

    assert import_response.status_code == status.HTTP_200_OK
    data = import_response.json()
    assert data["data"]["imported"] == 4


def test_export_import_roundtrip_json(
    client: TestClient, test_user: User, auth_headers: dict, sample_tasks: list[Task]
):
    """Test export followed by import (JSON roundtrip)."""
    # Export tasks
    export_response = client.get(
        f"/api/{test_user.id}/tasks/export?format=json", headers=auth_headers
    )
    assert export_response.status_code == status.HTTP_200_OK
    json_content = export_response.text

    # Delete all tasks
    for task in sample_tasks:
        client.delete(
            f"/api/{test_user.id}/tasks/{task.id}", headers=auth_headers
        )

    # Import tasks back
    files = {"file": ("tasks.json", json_content, "application/json")}
    import_response = client.post(
        f"/api/{test_user.id}/tasks/import", headers=auth_headers, files=files
    )

    assert import_response.status_code == status.HTTP_200_OK
    data = import_response.json()
    assert data["data"]["imported"] == 4
