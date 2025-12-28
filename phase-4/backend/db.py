"""
Database connection and session management for Neon PostgreSQL.

This module provides database engine configuration, session management,
and connection pooling for the Todo application.
"""

import os
import re
from pathlib import Path
from typing import AsyncGenerator

from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker

# Import all models to ensure they're registered with SQLModel.metadata
from models.conversation import Conversation  # noqa: F401
from models.message import Message  # noqa: F401

# Load environment variables from .env file
# Look for .env file in the backend directory
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    # Fallback: try to load from current directory
    load_dotenv()

# Get database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Check if we're in test environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_TEST = ENVIRONMENT == "test"

# Validate DATABASE_URL is set (unless in test mode)
if not DATABASE_URL and not IS_TEST:
    raise ValueError("DATABASE_URL environment variable is not set")

# For test environment, use in-memory SQLite
if IS_TEST or not DATABASE_URL:
    DATABASE_URL = "sqlite:///:memory:"
else:
    # Convert postgres:// to postgresql:// for SQLAlchemy
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create synchronous engine for migrations
if IS_TEST or DATABASE_URL.startswith("sqlite"):
    # SQLite doesn't support pool_size, max_overflow, pool_pre_ping
    # Disable SQL query logging for cleaner logs (set echo=False)
    # Set SQL_ECHO=true in .env if you want to see SQL queries
    sql_echo = os.getenv("SQL_ECHO", "false").lower() in ("true", "1", "yes")
    sync_engine = create_engine(
        DATABASE_URL,
        echo=sql_echo,
        connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    )
else:
    # PostgreSQL supports connection pooling
    # Disable SQL query logging for cleaner logs (set SQL_ECHO=true in .env if needed)
    sql_echo = os.getenv("SQL_ECHO", "false").lower() in ("true", "1", "yes")
    sync_engine = create_engine(
        DATABASE_URL,
        echo=sql_echo,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
    )

# Create asynchronous engine for application (only for PostgreSQL)
if not IS_TEST and DATABASE_URL != "sqlite:///:memory:":
    # Convert postgresql:// to postgresql+asyncpg:// for async support
    # Strip query parameters from URL (asyncpg doesn't accept them in URL, they go in connect_args)
    async_database_url = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

    # Parse and remove query parameters from URL
    connect_args = {}
    if "?" in async_database_url:
        base_url, query_string = async_database_url.split("?", 1)
        async_database_url = base_url

        # Parse query parameters
        for param in query_string.split("&"):
            if "=" in param:
                key, value = param.split("=", 1)
                # asyncpg uses 'ssl' parameter (boolean), not 'sslmode' (string)
                if key == "sslmode":
                    connect_args["ssl"] = value in ("require", "prefer")
                # Skip other Neon-specific parameters that asyncpg doesn't use

    # Use same SQL_ECHO setting for async engine
    sql_echo = os.getenv("SQL_ECHO", "false").lower() in ("true", "1", "yes")

    # Create async engine with proper asyncpg configuration
    # Reference: https://docs.sqlalchemy.org/en/20/dialects/postgresql.html
    async_engine = create_async_engine(
        async_database_url,
        echo=sql_echo,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        connect_args=connect_args if connect_args else {"ssl": True},
    )

    # Create async session maker
    AsyncSessionLocal = sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
else:
    # For test environment, async operations not supported with SQLite
    async_engine = None
    AsyncSessionLocal = None


def create_db_and_tables():
    """
    Create all database tables based on SQLModel models.

    This function should be called during application startup
    to ensure all tables exist.
    """
    SQLModel.metadata.create_all(sync_engine)


def get_session() -> Session:
    """
    Dependency function to get a database session.

    Yields:
        Session: SQLModel database session

    Example:
        ```python
        @app.get("/items")
        def get_items(session: Session = Depends(get_session)):
            items = session.exec(select(Item)).all()
            return items
        ```
    """
    with Session(sync_engine) as session:
        yield session


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to get an async database session.

    Yields:
        AsyncSession: SQLModel async database session

    Example:
        ```python
        @app.get("/items")
        async def get_items(session: AsyncSession = Depends(get_async_session)):
            result = await session.exec(select(Item))
            items = result.all()
            return items
        ```
    """
    async with AsyncSessionLocal() as session:
        yield session
