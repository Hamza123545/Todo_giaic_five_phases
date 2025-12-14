"""
SQLModel database models for the Todo application.

This module defines the database schema for Users and Tasks.
"""

from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlmodel import Column, Field, JSON, SQLModel


def generate_uuid() -> str:
    """Generate a string UUID for user IDs."""
    return str(uuid4())


class User(SQLModel, table=True):
    """
    User model for authentication and user management.

    Attributes:
        id: Unique user identifier (UUID)
        email: User's email address (unique)
        password_hash: Securely hashed password
        name: User's display name
        created_at: Account creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "users"

    id: str = Field(default_factory=generate_uuid, primary_key=True)
    email: str = Field(max_length=255, unique=True, index=True, nullable=False)
    password_hash: str = Field(nullable=False)
    name: str = Field(max_length=100, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, nullable=False, sa_column_kwargs={"onupdate": datetime.utcnow}
    )


class Task(SQLModel, table=True):
    """
    Task model for task management.

    Attributes:
        id: Unique task identifier (auto-increment)
        user_id: Owner of the task (foreign key to users)
        title: Task title (required)
        description: Task description (optional)
        priority: Task priority level (low|medium|high)
        due_date: Due date for task completion (optional)
        tags: Tags for task categorization (JSON array)
        completed: Completion status
        created_at: Task creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(nullable=False, index=True)  # Better Auth user ID (no FK since Better Auth manages users)
    title: str = Field(max_length=200, nullable=False)
    description: Optional[str] = Field(default=None, max_length=1000)
    priority: str = Field(default="medium", nullable=False, index=True)
    due_date: Optional[datetime] = Field(default=None, index=True)
    tags: Optional[list[str]] = Field(default=None, sa_column=Column(JSON))
    completed: bool = Field(default=False, nullable=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, nullable=False, sa_column_kwargs={"onupdate": datetime.utcnow}
    )
