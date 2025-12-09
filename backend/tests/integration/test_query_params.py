"""
Integration tests for query parameters functionality.

This module tests the filtering, sorting, search, and pagination features of the task endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from uuid import uuid4

from main import app
from models import User, Task
from services.auth_service import AuthService
from services.task_service import TaskService


@pytest.fixture
def client():
    """Test client for the FastAPI app."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def test_user(session: Session):
    """Create a test user."""
    auth_service = AuthService()
    user = auth_service.create_user(
        db=session,
        email="test@example.com",
        password="password123",
        name="Test User"
    )
    return user


@pytest.fixture
def auth_headers(client: TestClient, test_user):
    """Get authentication headers for test user."""
    # Sign in to get token
    response = client.post("/api/auth/signin", json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    token = response.json()["data"]["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_tasks(session: Session, test_user):
    """Create sample tasks for testing."""
    task_service = TaskService()

    # Create various tasks with different properties
    task1 = task_service.create_task(
        db=session,
        user_id=test_user.id,
        title="High Priority Task",
        description="This is a high priority task",
        priority="high",
        completed=False
    )

    task2 = task_service.create_task(
        db=session,
        user_id=test_user.id,
        title="Low Priority Task",
        description="This is a low priority task",
        priority="low",
        completed=True
    )

    task3 = task_service.create_task(
        db=session,
        user_id=test_user.id,
        title="Medium Priority Task",
        description="This is a medium priority task",
        priority="medium",
        completed=False
    )

    task4 = task_service.create_task(
        db=session,
        user_id=test_user.id,
        title="Another High Priority Task",
        description="This is another high priority task with different content",
        priority="high",
        completed=True
    )

    return [task1, task2, task3, task4]


class TestQueryParams:
    """Test class for query parameters functionality."""

    def test_get_tasks_with_status_filter(self, client: TestClient, test_user, auth_headers, sample_tasks):
        """Test filtering tasks by status."""
        # Test pending status
        response = client.get(f"/api/{test_user.id}/tasks",
                            params={"status": "pending"},
                            headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 2  # task1 and task3 are pending

        for task in data["data"]:
            assert task["completed"] is False

        # Test completed status
        response = client.get(f"/api/{test_user.id}/tasks",
                            params={"status": "completed"},
                            headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 2  # task2 and task4 are completed

        for task in data["data"]:
            assert task["completed"] is True

        # Test all status (default)
        response = client.get(f"/api/{test_user.id}/tasks",
                            params={"status": "all"},
                            headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 4  # All tasks

    def test_get_tasks_with_priority_filter(self, client: TestClient, test_user, auth_headers, sample_tasks):
        """Test filtering tasks by priority."""
        # Test high priority
        response = client.get(f"/api/{test_user.id}/tasks",
                            params={"priority": "high"},
                            headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 2  # task1 and task4 are high priority

        for task in data["data"]:
            assert task["priority"] == "high"

        # Test low priority
        response = client.get(f"/api/{test_user.id}/tasks",
                            params={"priority": "low"},
                            headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 1  # task2 is low priority

        for task in data["data"]:
            assert task["priority"] == "low"

    def test_get_tasks_with_search_filter(self, client: TestClient, test_user, auth_headers, sample_tasks):
        """Test searching tasks by title/description."""
        # Search for "High Priority"
        response = client.get(f"/api/{test_user.id}/tasks",
                            params={"search": "High Priority"},
                            headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 2  # task1 and task4 contain "High Priority"

        for task in data["data"]:
            assert "High Priority" in task["title"]

    def test_get_tasks_with_sorting(self, client: TestClient, test_user, auth_headers, sample_tasks):
        """Test sorting tasks by different fields."""
        # Sort by priority (descending - high first)
        response = client.get(f"/api/{test_user.id}/tasks",
                            params={"sort": "priority", "sort_direction": "desc"},
                            headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

        priorities = [task["priority"] for task in data["data"]]
        # Should be sorted with high first, then medium, then low
        expected_order = ["high", "high", "medium", "low"]
        assert priorities == expected_order

    def test_get_tasks_with_pagination(self, client: TestClient, test_user, auth_headers, sample_tasks):
        """Test pagination functionality."""
        # Get first page with limit 2
        response = client.get(f"/api/{test_user.id}/tasks",
                            params={"page": 1, "limit": 2},
                            headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 2
        assert data["meta"]["page"] == 1
        assert data["meta"]["limit"] == 2
        assert data["meta"]["total"] == 4

        # Get second page with limit 2
        response = client.get(f"/api/{test_user.id}/tasks",
                            params={"page": 2, "limit": 2},
                            headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 2
        assert data["meta"]["page"] == 2
        assert data["meta"]["limit"] == 2
        assert data["meta"]["total"] == 4

    def test_get_tasks_with_combined_filters(self, client: TestClient, test_user, auth_headers, sample_tasks):
        """Test combining multiple filters."""
        # Filter by status=pending AND priority=high
        response = client.get(f"/api/{test_user.id}/tasks",
                            params={"status": "pending", "priority": "high"},
                            headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 1  # Only task1 matches both criteria

        task = data["data"][0]
        assert task["completed"] is False
        assert task["priority"] == "high"
        assert "High Priority" in task["title"]

    def test_invalid_query_parameters(self, client: TestClient, test_user, auth_headers):
        """Test handling of invalid query parameters."""
        # Invalid status
        response = client.get(f"/api/{test_user.id}/tasks",
                            params={"status": "invalid_status"},
                            headers=auth_headers)
        assert response.status_code == 400

        # Invalid priority
        response = client.get(f"/api/{test_user.id}/tasks",
                            params={"priority": "invalid_priority"},
                            headers=auth_headers)
        assert response.status_code == 400

        # Invalid sort field
        response = client.get(f"/api/{test_user.id}/tasks",
                            params={"sort": "invalid_field"},
                            headers=auth_headers)
        assert response.status_code == 400

        # Invalid sort direction
        response = client.get(f"/api/{test_user.id}/tasks",
                            params={"sort_direction": "invalid_dir"},
                            headers=auth_headers)
        assert response.status_code == 400

        # Invalid page number
        response = client.get(f"/api/{test_user.id}/tasks",
                            params={"page": 0},
                            headers=auth_headers)
        assert response.status_code == 400

        # Invalid limit
        response = client.get(f"/api/{test_user.id}/tasks",
                            params={"limit": 0},
                            headers=auth_headers)
        assert response.status_code == 400

        response = client.get(f"/api/{test_user.id}/tasks",
                            params={"limit": 101},
                            headers=auth_headers)
        assert response.status_code == 400