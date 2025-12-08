"""
Pytest configuration and fixtures for backend tests.

This module provides shared fixtures for testing the Todo application backend.
"""

import os
from typing import Generator

# Set test environment BEFORE importing other modules
os.environ["ENVIRONMENT"] = "test"

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from main import app
from db import get_session

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
