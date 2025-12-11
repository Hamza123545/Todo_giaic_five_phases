"""
Tests for user isolation functionality.

This module tests that users cannot access other users' data
and that user isolation is properly enforced.
"""

from fastapi.testclient import TestClient
from sqlmodel import Session

from main import app
from models import User, Task
from utils.auth import generate_jwt_token

client = TestClient(app)


def test_user_cannot_access_other_users_tasks(session: Session):
    """Test that a user cannot access another user's tasks."""
    # Create two users
    user1 = User(
        email="user1@example.com",
        password_hash="hashed_password",
        name="User One"
    )
    user2 = User(
        email="user2@example.com",
        password_hash="hashed_password",
        name="User Two"
    )
    session.add(user1)
    session.add(user2)
    session.commit()
    session.refresh(user1)
    session.refresh(user2)

    # Create task for user2
    task = Task(
        user_id=user2.id,
        title="User 2's Task",
        description="This belongs to user 2",
    )
    session.add(task)
    session.commit()
    session.refresh(task)

    # Create JWT token for user1
    token = generate_jwt_token(str(user1.id), user1.email)

    # Try to access user2's tasks with user1's token
    response = client.get(
        f"/api/{user2.id}/tasks",
        headers={"Authorization": f"Bearer {token}"}
    )

    # Should get 403 Forbidden
    assert response.status_code == 403
    data = response.json()
    assert data["success"] is False
    assert "mismatch" in data["error"]["message"].lower()


def test_user_cannot_update_other_users_task(session: Session):
    """Test that a user cannot update another user's task."""
    # Create two users
    user1 = User(
        email="user1@example.com",
        password_hash="hashed_password",
        name="User One"
    )
    user2 = User(
        email="user2@example.com",
        password_hash="hashed_password",
        name="User Two"
    )
    session.add(user1)
    session.add(user2)
    session.commit()
    session.refresh(user1)
    session.refresh(user2)

    # Create task for user2
    task = Task(
        user_id=user2.id,
        title="User 2's Task",
        description="This belongs to user 2",
    )
    session.add(task)
    session.commit()
    session.refresh(task)

    # Create JWT token for user1
    token = generate_jwt_token(str(user1.id), user1.email)

    # Try to update user2's task with user1's token
    response = client.put(
        f"/api/{user2.id}/tasks/{task.id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Hacked!"}
    )

    # Should get 403 Forbidden
    assert response.status_code == 403


def test_user_cannot_delete_other_users_task(session: Session):
    """Test that a user cannot delete another user's task."""
    # Create two users
    user1 = User(
        email="user1@example.com",
        password_hash="hashed_password",
        name="User One"
    )
    user2 = User(
        email="user2@example.com",
        password_hash="hashed_password",
        name="User Two"
    )
    session.add(user1)
    session.add(user2)
    session.commit()
    session.refresh(user1)
    session.refresh(user2)

    # Create task for user2
    task = Task(
        user_id=user2.id,
        title="User 2's Task",
        description="This belongs to user 2",
    )
    session.add(task)
    session.commit()
    session.refresh(task)

    # Create JWT token for user1
    token = generate_jwt_token(str(user1.id), user1.email)

    # Try to delete user2's task with user1's token
    response = client.delete(
        f"/api/{user2.id}/tasks/{task.id}",
        headers={"Authorization": f"Bearer {token}"}
    )

    # Should get 403 Forbidden
    assert response.status_code == 403


def test_unauthenticated_access_rejected():
    """Test that unauthenticated requests are rejected."""
    # Try to access tasks without token
    response = client.get("/api/some-user-id/tasks")

    # Should get 401 or 403 (depending on route configuration)
    assert response.status_code in [401, 403]


def test_invalid_token_rejected():
    """Test that invalid JWT tokens are rejected."""
    # Try to access tasks with invalid token
    response = client.get(
        "/api/some-user-id/tasks",
        headers={"Authorization": "Bearer invalid_token"}
    )

    # Should get 401 Unauthorized
    assert response.status_code == 401
