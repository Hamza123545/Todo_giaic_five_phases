"""
Integration tests for task management endpoints.

This module tests all task CRUD operations with authentication and user isolation.
"""

import json
from datetime import datetime
from typing import Dict
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from main import app
from models import Task, User
from services.auth_service import AuthService
from utils.password import hash_password


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def auth_headers(client):
    """Create authentication headers for a test user."""
    # Create a test user
    signup_data = {
        "email": "test@example.com",
        "password": "testpassword123",
        "name": "Test User"
    }

    response = client.post("/api/auth/signup", json=signup_data)
    assert response.status_code == 201

    data = response.json()["data"]
    token = data["token"]

    headers = {"Authorization": f"Bearer {token}"}
    user_id = data["user"]["id"]

    return headers, user_id


def test_create_task_success(client, auth_headers):
    """Test successful task creation."""
    headers, user_id = auth_headers

    task_data = {
        "title": "Test Task",
        "description": "Test description",
        "priority": "medium",
        "due_date": "2024-12-31T23:59:59Z",
        "tags": ["test", "important"]
    }

    response = client.post(f"/api/{user_id}/tasks", json=task_data, headers=headers)

    assert response.status_code == 201
    data = response.json()

    assert data["success"] is True
    assert data["id"] is not None
    assert data["title"] == "Test Task"
    assert data["description"] == "Test description"
    assert data["priority"] == "medium"
    assert data["completed"] is False
    assert data["tags"] == ["test", "important"]


def test_create_task_validation_error(client, auth_headers):
    """Test task creation with validation errors."""
    headers, user_id = auth_headers

    # Task with empty title
    task_data = {
        "title": "",
        "description": "Test description"
    }

    response = client.post(f"/api/{user_id}/tasks", json=task_data, headers=headers)

    assert response.status_code == 400


def test_get_tasks_success(client, auth_headers):
    """Test successful retrieval of tasks."""
    headers, user_id = auth_headers

    # Create a task first
    task_data = {
        "title": "Test Task",
        "description": "Test description"
    }

    create_response = client.post(f"/api/{user_id}/tasks", json=task_data, headers=headers)
    assert create_response.status_code == 201

    # Get tasks
    response = client.get(f"/api/{user_id}/tasks", headers=headers)

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert len(data["data"]) >= 1
    assert data["meta"]["total"] >= 1


def test_get_task_by_id_success(client, auth_headers):
    """Test successful retrieval of a specific task."""
    headers, user_id = auth_headers

    # Create a task first
    task_data = {
        "title": "Test Task",
        "description": "Test description"
    }

    create_response = client.post(f"/api/{user_id}/tasks", json=task_data, headers=headers)
    assert create_response.status_code == 201

    task_id = create_response.json()["id"]

    # Get the specific task
    response = client.get(f"/api/{user_id}/tasks/{task_id}", headers=headers)

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["data"]["id"] == task_id
    assert data["data"]["title"] == "Test Task"


def test_update_task_success(client, auth_headers):
    """Test successful task update."""
    headers, user_id = auth_headers

    # Create a task first
    task_data = {
        "title": "Original Task",
        "description": "Original description"
    }

    create_response = client.post(f"/api/{user_id}/tasks", json=task_data, headers=headers)
    assert create_response.status_code == 201

    task_id = create_response.json()["id"]

    # Update the task
    update_data = {
        "title": "Updated Task",
        "description": "Updated description",
        "priority": "high"
    }

    response = client.put(f"/api/{user_id}/tasks/{task_id}", json=update_data, headers=headers)

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["data"]["title"] == "Updated Task"
    assert data["data"]["description"] == "Updated description"
    assert data["data"]["priority"] == "high"


def test_delete_task_success(client, auth_headers):
    """Test successful task deletion."""
    headers, user_id = auth_headers

    # Create a task first
    task_data = {
        "title": "Test Task to Delete",
        "description": "Test description"
    }

    create_response = client.post(f"/api/{user_id}/tasks", json=task_data, headers=headers)
    assert create_response.status_code == 201

    task_id = create_response.json()["id"]

    # Delete the task
    response = client.delete(f"/api/{user_id}/tasks/{task_id}", headers=headers)

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["message"] == "Task deleted successfully"


def test_toggle_task_complete_success(client, auth_headers):
    """Test successful task completion toggle."""
    headers, user_id = auth_headers

    # Create a task first
    task_data = {
        "title": "Test Task",
        "description": "Test description"
    }

    create_response = client.post(f"/api/{user_id}/tasks", json=task_data, headers=headers)
    assert create_response.status_code == 201

    task_id = create_response.json()["id"]

    # Toggle task completion
    toggle_data = {"completed": True}

    response = client.patch(f"/api/{user_id}/tasks/{task_id}/complete", json=toggle_data, headers=headers)

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["data"]["completed"] is True


def test_user_isolation(client, auth_headers):
    """Test that users cannot access other users' tasks."""
    headers, user_id = auth_headers

    # Create a second user
    signup_data2 = {
        "email": "test2@example.com",
        "password": "testpassword123",
        "name": "Test User 2"
    }

    response2 = client.post("/api/auth/signup", json=signup_data2)
    assert response2.status_code == 201

    data2 = response2.json()["data"]
    headers2 = {"Authorization": f"Bearer {data2['token']}"}
    user_id2 = data2["user"]["id"]

    # First user creates a task
    task_data = {
        "title": "Test Task",
        "description": "Test description"
    }

    create_response = client.post(f"/api/{user_id}/tasks", json=task_data, headers=headers)
    assert create_response.status_code == 201

    task_id = create_response.json()["id"]

    # Second user should not be able to access the first user's task
    response = client.get(f"/api/{user_id}/tasks/{task_id}", headers=headers2)

    # This should return 403 Forbidden due to user isolation
    assert response.status_code == 403


def test_task_validation_errors(client, auth_headers):
    """Test various task validation errors."""
    headers, user_id = auth_headers

    # Test title too long
    task_data = {
        "title": "a" * 201,  # More than 200 characters
        "description": "Test description"
    }

    response = client.post(f"/api/{user_id}/tasks", json=task_data, headers=headers)

    assert response.status_code == 400

    # Test invalid priority
    task_data = {
        "title": "Test Task",
        "description": "Test description",
        "priority": "invalid_priority"
    }

    response = client.post(f"/api/{user_id}/tasks", json=task_data, headers=headers)

    assert response.status_code == 400


def test_task_not_found(client, auth_headers):
    """Test responses for non-existent tasks."""
    headers, user_id = auth_headers

    # Try to get a non-existent task
    response = client.get(f"/api/{user_id}/tasks/999999", headers=headers)

    assert response.status_code == 404

    # Try to update a non-existent task
    update_data = {"title": "Updated Title"}
    response = client.put(f"/api/{user_id}/tasks/999999", json=update_data, headers=headers)

    assert response.status_code == 404

    # Try to delete a non-existent task
    response = client.delete(f"/api/{user_id}/tasks/999999", headers=headers)

    assert response.status_code == 404

    # Try to toggle completion of a non-existent task
    toggle_data = {"completed": True}
    response = client.patch(f"/api/{user_id}/tasks/999999/complete", json=toggle_data, headers=headers)

    assert response.status_code == 404