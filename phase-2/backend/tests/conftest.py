"""
Pytest configuration and fixtures for backend tests.

This module provides shared fixtures for testing the Todo application backend.
"""

import os
import warnings
from datetime import datetime, timedelta
from typing import Callable, Generator
from uuid import UUID, uuid4

# Set test environment BEFORE importing other modules
os.environ["ENVIRONMENT"] = "test"
# Set BETTER_AUTH_SECRET for testing (required for JWT token generation)
os.environ["BETTER_AUTH_SECRET"] = os.getenv(
    "BETTER_AUTH_SECRET", 
    "test-secret-key-for-jwt-token-generation-in-tests-only"
)

# Suppress bcrypt/passlib warnings in tests
# (password.py already handles bcrypt initialization properly)
warnings.filterwarnings("ignore", message=".*password cannot be longer than 72 bytes.*")
warnings.filterwarnings("ignore", category=UserWarning, module="passlib")
warnings.filterwarnings("ignore", message=".*bcrypt.*")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import Session, SQLModel, create_engine  # noqa: E402
from sqlmodel.pool import StaticPool  # noqa: E402

from main import app  # noqa: E402
from db import get_session  # noqa: E402
from models import Task, User  # noqa: E402
from utils.auth import generate_jwt_token  # noqa: E402
from utils.password import hash_password  # noqa: E402

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


# ============================================================================
# DATA FACTORIES
# ============================================================================


@pytest.fixture
def user_factory(session: Session) -> Callable:
    """
    Factory fixture for creating test users.

    Returns:
        Callable: Function to create users with custom data
    """

    def _create_user(
        email: str = None,
        password: str = "testpassword123",
        name: str = "Test User",
        **kwargs,
    ) -> User:
        """Create a user with specified or default values."""
        if email is None:
            email = f"testuser_{uuid4().hex[:8]}@example.com"

        user = User(
            email=email,
            password_hash=hash_password(password),
            name=name,
            **kwargs,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

    return _create_user


@pytest.fixture
def task_factory(session: Session) -> Callable:
    """
    Factory fixture for creating test tasks.

    Returns:
        Callable: Function to create tasks with custom data
    """

    def _create_task(
        user_id: UUID = None,
        title: str = "Test Task",
        description: str = None,
        priority: str = "medium",
        completed: bool = False,
        due_date: datetime = None,
        tags: list[str] = None,
        **kwargs,
    ) -> Task:
        """Create a task with specified or default values."""
        if user_id is None:
            # Create a default user if none provided
            user = User(
                email=f"taskuser_{uuid4().hex[:8]}@example.com",
                password_hash=hash_password("password123"),
                name="Task User",
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            user_id = user.id

        task = Task(
            user_id=user_id,
            title=title,
            description=description,
            priority=priority,
            completed=completed,
            due_date=due_date,
            tags=tags,
            **kwargs,
        )
        session.add(task)
        session.commit()
        session.refresh(task)
        return task

    return _create_task


@pytest.fixture
def batch_task_factory(session: Session, task_factory: Callable) -> Callable:
    """
    Factory fixture for creating multiple tasks at once.

    Returns:
        Callable: Function to create batch of tasks
    """

    def _create_batch_tasks(
        count: int,
        user_id: UUID = None,
        base_title: str = "Task",
        **kwargs,
    ) -> list[Task]:
        """Create multiple tasks with sequential titles."""
        tasks = []
        for i in range(count):
            task = task_factory(
                user_id=user_id,
                title=f"{base_title} {i + 1}",
                **kwargs,
            )
            tasks.append(task)
        return tasks

    return _create_batch_tasks


@pytest.fixture
def auth_user_factory(session: Session, user_factory: Callable) -> Callable:
    """
    Factory fixture for creating authenticated users with JWT tokens.

    Returns:
        Callable: Function to create user with auth headers
    """

    def _create_auth_user(
        email: str = None,
        password: str = "testpassword123",
        name: str = "Test User",
        **kwargs,
    ) -> dict:
        """Create a user with authentication token and headers."""
        user = user_factory(email=email, password=password, name=name, **kwargs)
        token = generate_jwt_token(str(user.id), user.email)

        return {
            "user": user,
            "token": token,
            "headers": {"Authorization": f"Bearer {token}"},
            "password": password,  # Store plain password for signin tests
        }

    return _create_auth_user


# ============================================================================
# COMMON TEST DATA FIXTURES
# ============================================================================


@pytest.fixture
def sample_task_data() -> dict:
    """
    Fixture providing sample task data for testing.

    Returns:
        dict: Sample task data
    """
    return {
        "title": "Sample Task",
        "description": "This is a sample task for testing",
        "priority": "medium",
        "tags": ["sample", "test"],
        "due_date": datetime.now() + timedelta(days=7),
    }


@pytest.fixture
def sample_user_data() -> dict:
    """
    Fixture providing sample user data for testing.

    Returns:
        dict: Sample user data
    """
    return {
        "email": f"sample_{uuid4().hex[:8]}@example.com",
        "password": "SamplePassword123",
        "name": "Sample User",
    }


@pytest.fixture
def varied_tasks(session: Session, user_factory: Callable, task_factory: Callable) -> dict:
    """
    Fixture creating a set of varied tasks for testing filters and queries.

    Returns:
        dict: User and tasks with different statuses, priorities, and dates
    """
    user = user_factory()

    today = datetime.now()
    tasks = {
        "completed_high": task_factory(
            user_id=user.id,
            title="Completed High Priority",
            priority="high",
            completed=True,
            due_date=today + timedelta(days=5),
        ),
        "completed_low": task_factory(
            user_id=user.id,
            title="Completed Low Priority",
            priority="low",
            completed=True,
        ),
        "pending_high": task_factory(
            user_id=user.id,
            title="Pending High Priority",
            priority="high",
            completed=False,
            due_date=today + timedelta(days=3),
        ),
        "pending_medium": task_factory(
            user_id=user.id,
            title="Pending Medium Priority",
            priority="medium",
            completed=False,
            tags=["urgent", "work"],
        ),
        "overdue": task_factory(
            user_id=user.id,
            title="Overdue Task",
            priority="high",
            completed=False,
            due_date=today - timedelta(days=2),
        ),
    }

    return {"user": user, "tasks": tasks}


@pytest.fixture
def csv_sample_content() -> str:
    """
    Fixture providing sample CSV content for import testing.

    Returns:
        str: Sample CSV content
    """
    return """title,description,priority,due_date,tags,completed
Task 1,Description 1,high,2024-12-31T23:59:59,work;urgent,false
Task 2,Description 2,medium,,personal,true
Task 3,Description 3,low,2024-11-30T12:00:00,home,false"""


@pytest.fixture
def json_sample_content() -> str:
    """
    Fixture providing sample JSON content for import testing.

    Returns:
        str: Sample JSON content
    """
    import json

    return json.dumps([
        {
            "title": "JSON Task 1",
            "description": "Description 1",
            "priority": "high",
            "completed": False,
            "tags": ["work", "urgent"],
        },
        {
            "title": "JSON Task 2",
            "priority": "medium",
            "completed": True,
        },
    ])


# ============================================================================
# PERFORMANCE TEST HELPERS
# ============================================================================


@pytest.fixture
def performance_threshold() -> dict:
    """
    Fixture providing performance thresholds for tests.

    Returns:
        dict: Performance thresholds in milliseconds
    """
    return {
        "unit_test": 100,  # Unit tests should complete in < 100ms
        "integration_test": 500,  # Integration tests should complete in < 500ms
        "api_test": 1000,  # API tests should complete in < 1000ms
        "query_large_dataset": 500,  # Queries on large datasets < 500ms
        "bulk_operation": 1000,  # Bulk operations < 1000ms
    }


@pytest.fixture
def timer():
    """
    Fixture providing a simple timer for performance testing.

    Returns:
        Callable: Timer context manager
    """
    import time
    from contextlib import contextmanager

    @contextmanager
    def _timer():
        start_time = time.time()
        timing_result = {"elapsed": 0}
        try:
            yield timing_result
        finally:
            timing_result["elapsed"] = (time.time() - start_time) * 1000  # Convert to ms

    return _timer


# ============================================================================
# ASYNC TEST FIXTURES (for httpx.AsyncClient tests)
# ============================================================================


@pytest.fixture
async def async_client(session: Session):
    """
    Fixture to create an async test client with dependency overrides.

    Args:
        session: Database session fixture

    Yields:
        AsyncClient: FastAPI async test client
    """
    from httpx import AsyncClient

    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(session: Session) -> User:
    """
    Fixture creating a test user for integration tests.

    Returns:
        User: Test user instance
    """
    user = User(
        email=f"testuser_{uuid4().hex[:8]}@example.com",
        password_hash=hash_password("testpassword123"),
        name="Test User",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture
def db_session(session: Session) -> Session:
    """
    Fixture alias for session (for compatibility with existing tests).

    Args:
        session: Database session fixture

    Returns:
        Session: Database session
    """
    return session


@pytest.fixture
def db(session: Session) -> Session:
    """
    Fixture alias for session (for compatibility with existing tests).

    Args:
        session: Database session fixture

    Returns:
        Session: Database session
    """
    return session


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """
    Fixture creating auth headers for authenticated requests.

    Args:
        test_user: Test user fixture

    Returns:
        dict: Authorization headers
    """
    token = generate_jwt_token(str(test_user.id), test_user.email)
    return {"Authorization": f"Bearer {token}"}
