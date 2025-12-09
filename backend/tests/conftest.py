"""
Pytest configuration and fixtures for backend tests.

This module provides shared fixtures for testing the Todo application backend.
"""

import os
from datetime import datetime, timedelta
from typing import Dict, Generator, List
from uuid import UUID, uuid4

# Set test environment BEFORE importing other modules
os.environ["ENVIRONMENT"] = "test"
os.environ["BETTER_AUTH_SECRET"] = "test-secret-key-for-testing-only"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from main import app
from db import get_session
from models import User, Task
from utils.password import hash_password
from utils.auth import generate_jwt_token

# Create in-memory SQLite database for testing
SQLITE_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLITE_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@pytest.fixture(name="session")
def session_fixture() -> Generator[Session, None, None]:
    """
    Fixture to create a fresh database session for each test.

    Yields:
        Session: SQLModel database session
    """
    SQLModel.metadata.create_all(test_engine)
    with Session(test_engine) as session:
        yield session
    SQLModel.metadata.drop_all(test_engine)


@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator[TestClient, None, None]:
    """
    Fixture to create a test client with dependency overrides.

    Args:
        session: Database session fixture

    Yields:
        TestClient: FastAPI test client
    """

    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="test_user")
def test_user_fixture(session: Session) -> User:
    """
    Fixture to create a test user in the database.

    Args:
        session: Database session fixture

    Returns:
        User: Created test user object
    """
    test_password = "testpass123"  # Simple test password (under 72 bytes)
    user = User(
        id=uuid4(),
        email="test@example.com",
        password_hash=hash_password(test_password),
        name="Test User"
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="test_user_2")
def test_user_2_fixture(session: Session) -> User:
    """
    Fixture to create a second test user for testing user isolation.

    Args:
        session: Database session fixture

    Returns:
        User: Created second test user object
    """
    test_password = "testpass456"  # Simple test password (under 72 bytes)
    user = User(
        id=uuid4(),
        email="test2@example.com",
        password_hash=hash_password(test_password),
        name="Test User 2"
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="auth_token")
def auth_token_fixture(test_user: User) -> str:
    """
    Fixture to create a JWT token for the test user.

    Args:
        test_user: Test user fixture

    Returns:
        str: JWT access token
    """
    return generate_jwt_token(str(test_user.id), test_user.email)


@pytest.fixture(name="auth_headers")
def auth_headers_fixture(auth_token: str) -> Dict[str, str]:
    """
    Fixture to create authorization headers for API requests.

    Args:
        auth_token: JWT token fixture

    Returns:
        Dict[str, str]: Headers with Authorization bearer token
    """
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(name="auth_token_2")
def auth_token_2_fixture(test_user_2: User) -> str:
    """
    Fixture to create a JWT token for the second test user.

    Args:
        test_user_2: Second test user fixture

    Returns:
        str: JWT access token for second user
    """
    return generate_jwt_token(str(test_user_2.id), test_user_2.email)


@pytest.fixture(name="auth_headers_2")
def auth_headers_2_fixture(auth_token_2: str) -> Dict[str, str]:
    """
    Fixture to create authorization headers for the second test user.

    Args:
        auth_token_2: JWT token for second user

    Returns:
        Dict[str, str]: Headers with Authorization bearer token
    """
    return {"Authorization": f"Bearer {auth_token_2}"}


@pytest.fixture(name="sample_tasks")
def sample_tasks_fixture(session: Session, test_user: User) -> List[Task]:
    """
    Fixture to create sample tasks for testing.

    Args:
        session: Database session fixture
        test_user: Test user fixture

    Returns:
        List[Task]: List of created test tasks
    """
    tasks = [
        Task(
            user_id=test_user.id,
            title="Task 1",
            description="Description for task 1",
            priority="high",
            due_date=datetime.utcnow() + timedelta(days=1),
            tags=["work", "urgent"],
            completed=False
        ),
        Task(
            user_id=test_user.id,
            title="Task 2",
            description="Description for task 2",
            priority="medium",
            due_date=datetime.utcnow() + timedelta(days=7),
            tags=["personal"],
            completed=False
        ),
        Task(
            user_id=test_user.id,
            title="Task 3",
            description="Description for task 3",
            priority="low",
            due_date=None,
            tags=[],
            completed=True
        ),
        Task(
            user_id=test_user.id,
            title="Task 4 - Overdue",
            description="This task is overdue",
            priority="high",
            due_date=datetime.utcnow() - timedelta(days=1),
            tags=["overdue"],
            completed=False
        ),
    ]

    for task in tasks:
        session.add(task)

    session.commit()

    for task in tasks:
        session.refresh(task)

    return tasks


@pytest.fixture(name="mock_db_session")
def mock_db_session_fixture():
    """
    Fixture to create a mock database session for unit tests.

    Returns:
        Mock: Mock database session object
    """
    from unittest.mock import Mock
    return Mock(spec=Session)
