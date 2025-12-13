"""
Request schemas for API endpoints.

This module defines Pydantic models for validating incoming requests.
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class SignupRequest(BaseModel):
    """
    Request schema for user signup.

    Attributes:
        email: User's email address (validated)
        password: User's password (min 8 characters)
        name: User's display name (max 100 characters)

    Example:
        {
            "email": "user@example.com",
            "password": "SecurePass123!",
            "name": "John Doe"
        }
    """

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "user@example.com",
                    "password": "SecurePass123!",
                    "name": "John Doe"
                }
            ]
        }
    }

    email: EmailStr = Field(..., description="User's email address", examples=["user@example.com"])
    password: str = Field(..., min_length=8, description="Password (minimum 8 characters)", examples=["SecurePass123!"])
    name: str = Field(..., max_length=100, description="User's display name", examples=["John Doe"])

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets strength requirements."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate name is not empty after stripping."""
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class SigninRequest(BaseModel):
    """
    Request schema for user signin.

    Attributes:
        email: User's email address
        password: User's password

    Example:
        {
            "email": "user@example.com",
            "password": "SecurePass123!"
        }
    """

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "user@example.com",
                    "password": "SecurePass123!"
                }
            ]
        }
    }

    email: EmailStr = Field(..., description="User's email address", examples=["user@example.com"])
    password: str = Field(..., description="User's password", examples=["SecurePass123!"])


class ResetPasswordRequest(BaseModel):
    """
    Request schema for password reset.

    Attributes:
        email: User's email address
        new_password: New password (min 8 characters)

    Example:
        {
            "email": "user@example.com",
            "new_password": "NewSecurePass123!"
        }
    """

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "user@example.com",
                    "new_password": "NewSecurePass123!"
                }
            ]
        }
    }

    email: EmailStr = Field(..., description="User's email address", examples=["user@example.com"])
    new_password: str = Field(..., min_length=8, description="New password (minimum 8 characters)", examples=["NewSecurePass123!"])

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets strength requirements."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class CreateTaskRequest(BaseModel):
    """
    Request schema for creating a new task.

    Attributes:
        title: Task title (required, max 200 characters)
        description: Task description (optional, max 1000 characters)
        priority: Task priority (low, medium, high)
        due_date: Due date for task completion (optional)
        tags: Tags for task categorization (optional)

    Example:
        {
            "title": "Complete project documentation",
            "description": "Write comprehensive API documentation for the backend",
            "priority": "high",
            "due_date": "2025-12-15T23:59:59Z",
            "tags": ["documentation", "backend", "urgent"]
        }
    """

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "title": "Complete project documentation",
                    "description": "Write comprehensive API documentation for the backend",
                    "priority": "high",
                    "due_date": "2025-12-15T23:59:59Z",
                    "tags": ["documentation", "backend", "urgent"]
                }
            ]
        }
    }

    title: str = Field(..., max_length=200, description="Task title", examples=["Complete project documentation"])
    description: Optional[str] = Field(None, max_length=1000, description="Task description", examples=["Write comprehensive API documentation for the backend"])
    priority: Optional[str] = Field("medium", description="Task priority (low, medium, high)", examples=["high"])
    due_date: Optional[datetime] = Field(None, description="Due date for task completion (ISO 8601 format)", examples=["2025-12-15T23:59:59Z"])
    tags: Optional[list[str]] = Field(None, description="Tags for task categorization", examples=[["documentation", "backend", "urgent"]])

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        """Validate title is not empty after stripping."""
        if not v or not v.strip():
            raise ValueError("Title cannot be empty")
        if len(v) > 200:
            raise ValueError("Title must be at most 200 characters")
        return v.strip()

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """Validate description length."""
        if v is not None:
            if len(v) > 1000:
                raise ValueError("Description must be at most 1000 characters")
            return v.strip() if v.strip() else None
        return None

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> str:
        """Validate priority is one of the allowed values."""
        if v is None:
            return "medium"
        valid_priorities = ["low", "medium", "high"]
        if v.lower() not in valid_priorities:
            raise ValueError(f"Priority must be one of: {', '.join(valid_priorities)}")
        return v.lower()

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        """Validate tags are not empty strings."""
        if v is not None:
            cleaned_tags = [tag.strip() for tag in v if tag and tag.strip()]
            return cleaned_tags if cleaned_tags else None
        return None


class UpdateTaskRequest(BaseModel):
    """
    Request schema for updating a task.

    All fields are optional - only provided fields will be updated.

    Attributes:
        title: Task title (max 200 characters)
        description: Task description (max 1000 characters)
        priority: Task priority (low, medium, high)
        due_date: Due date for task completion
        tags: Tags for task categorization

    Example:
        {
            "title": "Updated task title",
            "priority": "low",
            "tags": ["updated", "reviewed"]
        }
    """

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "title": "Updated task title",
                    "priority": "low",
                    "tags": ["updated", "reviewed"]
                }
            ]
        }
    }

    title: Optional[str] = Field(None, max_length=200, description="Task title", examples=["Updated task title"])
    description: Optional[str] = Field(None, max_length=1000, description="Task description", examples=["Updated description"])
    priority: Optional[str] = Field(None, description="Task priority (low, medium, high)", examples=["low"])
    due_date: Optional[datetime] = Field(None, description="Due date for task completion (ISO 8601 format)", examples=["2025-12-20T23:59:59Z"])
    tags: Optional[list[str]] = Field(None, description="Tags for task categorization", examples=[["updated", "reviewed"]])

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        """Validate title is not empty after stripping."""
        if v is not None:
            if not v.strip():
                raise ValueError("Title cannot be empty")
            if len(v) > 200:
                raise ValueError("Title must be at most 200 characters")
            return v.strip()
        return None

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """Validate description length."""
        if v is not None:
            if len(v) > 1000:
                raise ValueError("Description must be at most 1000 characters")
            return v.strip() if v.strip() else None
        return None

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        """Validate priority is one of the allowed values."""
        if v is not None:
            valid_priorities = ["low", "medium", "high"]
            if v.lower() not in valid_priorities:
                raise ValueError(f"Priority must be one of: {', '.join(valid_priorities)}")
            return v.lower()
        return None

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        """Validate tags are not empty strings."""
        if v is not None:
            cleaned_tags = [tag.strip() for tag in v if tag and tag.strip()]
            return cleaned_tags if cleaned_tags else None
        return None


class ToggleCompleteRequest(BaseModel):
    """
    Request schema for toggling task completion status.

    Attributes:
        completed: Task completion status

    Example:
        {
            "completed": true
        }
    """

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "completed": True
                }
            ]
        }
    }

    completed: bool = Field(..., description="Task completion status", examples=[True])


class BulkOperationRequest(BaseModel):
    """
    Request schema for bulk operations on tasks.

    Attributes:
        operation: Operation to perform on tasks
        task_ids: List of task IDs to operate on

    Example:
        {
            "operation": "complete",
            "task_ids": [1, 2, 3, 5, 8]
        }
    """

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "operation": "complete",
                    "task_ids": [1, 2, 3, 5, 8]
                }
            ]
        }
    }

    operation: Literal[
        "delete",
        "complete",
        "pending",
        "priority_low",
        "priority_medium",
        "priority_high",
    ] = Field(..., description="Bulk operation to perform", examples=["complete"])
    task_ids: list[int] = Field(
        ..., min_length=1, description="List of task IDs to operate on (at least 1 required)", examples=[[1, 2, 3, 5, 8]]
    )
