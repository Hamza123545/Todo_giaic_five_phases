"""
Tests for performance optimization and 1000+ task handling.

This module tests that the application can handle large datasets
efficiently with proper pagination and query optimization.
"""

from fastapi.testclient import TestClient
from sqlmodel import Session
from datetime import datetime, timedelta

from main import app
from models import User, Task
from utils.auth import generate_jwt_token

client = TestClient(app)


def test_pagination_with_1000_tasks(session: Session):
    """Test that pagination works correctly with 1000+ tasks."""
    # Create user
    user = User(
        email="test@example.com",
        password_hash="hashed_password",
        name="Test User"
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Create 1000 tasks
    tasks = []
    for i in range(1000):
        task = Task(
            user_id=user.id,
            title=f"Task {i}",
            description=f"Description for task {i}",
            priority="medium" if i % 3 == 0 else "low",
            completed=i % 2 == 0,
        )
        tasks.append(task)

    session.add_all(tasks)
    session.commit()

    # Create JWT token
    token = generate_jwt_token(str(user.id), user.email)

    # Test pagination
    response = client.get(
        f"/api/{user.id}/tasks?limit=20&page=1",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()

    # Check pagination metadata
    assert "meta" in data
    assert data["meta"]["total"] == 1000
    assert data["meta"]["page"] == 1
    assert data["meta"]["limit"] == 20
    assert data["meta"]["totalPages"] == 50

    # Check data length
    assert len(data["data"]) == 20


def test_filtering_performance_with_large_dataset(session: Session):
    """Test that filtering performs well with large datasets."""
    # Create user
    user = User(
        email="test@example.com",
        password_hash="hashed_password",
        name="Test User"
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Create 1000 tasks with various properties
    tasks = []
    for i in range(1000):
        task = Task(
            user_id=user.id,
            title=f"Task {i}",
            description=f"Description for task {i}",
            priority=["low", "medium", "high"][i % 3],
            completed=i % 2 == 0,
            due_date=datetime.utcnow() + timedelta(days=i % 30),
        )
        tasks.append(task)

    session.add_all(tasks)
    session.commit()

    # Create JWT token
    token = generate_jwt_token(str(user.id), user.email)

    # Test filtering by priority
    response = client.get(
        f"/api/{user.id}/tasks?priority=high&limit=100",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()

    # Check that all returned tasks have high priority
    for task in data["data"]:
        assert task["priority"] == "high"


def test_search_performance_with_large_dataset(session: Session):
    """Test that search performs well with large datasets."""
    # Create user
    user = User(
        email="test@example.com",
        password_hash="hashed_password",
        name="Test User"
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Create 1000 tasks
    tasks = []
    for i in range(1000):
        task = Task(
            user_id=user.id,
            title=f"Task {i}",
            description=f"Special keyword in task {i}" if i % 10 == 0 else f"Description {i}",
        )
        tasks.append(task)

    session.add_all(tasks)
    session.commit()

    # Create JWT token
    token = generate_jwt_token(str(user.id), user.email)

    # Test search
    response = client.get(
        f"/api/{user.id}/tasks?search=Special keyword",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()

    # Should find approximately 100 tasks (every 10th task)
    assert len(data["data"]) >= 90  # Allow some variance


def test_sorting_performance_with_large_dataset(session: Session):
    """Test that sorting performs well with large datasets."""
    # Create user
    user = User(
        email="test@example.com",
        password_hash="hashed_password",
        name="Test User"
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Create 1000 tasks
    tasks = []
    for i in range(1000):
        task = Task(
            user_id=user.id,
            title=f"Task {1000 - i}",  # Reverse order for testing
            description=f"Description {i}",
        )
        tasks.append(task)

    session.add_all(tasks)
    session.commit()

    # Create JWT token
    token = generate_jwt_token(str(user.id), user.email)

    # Test sorting by title
    response = client.get(
        f"/api/{user.id}/tasks?sort=title&limit=10",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()

    # Check that tasks are sorted
    titles = [task["title"] for task in data["data"]]
    assert titles == sorted(titles)


def test_response_time_under_2_seconds(session: Session):
    """Test that API responses are under 2 seconds (p95 requirement)."""
    import time

    # Create user
    user = User(
        email="test@example.com",
        password_hash="hashed_password",
        name="Test User"
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Create 1000 tasks
    tasks = []
    for i in range(1000):
        task = Task(
            user_id=user.id,
            title=f"Task {i}",
            description=f"Description for task {i}",
        )
        tasks.append(task)

    session.add_all(tasks)
    session.commit()

    # Create JWT token
    token = generate_jwt_token(str(user.id), user.email)

    # Measure response time
    start_time = time.time()
    response = client.get(
        f"/api/{user.id}/tasks?limit=100",
        headers={"Authorization": f"Bearer {token}"}
    )
    end_time = time.time()

    duration = end_time - start_time

    assert response.status_code == 200
    # Should respond in under 2 seconds
    assert duration < 2.0, f"Response took {duration:.2f} seconds"
