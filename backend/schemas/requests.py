"""
Request schemas for API endpoints.

This module defines Pydantic models for validating incoming requests.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class SignupRequest(BaseModel):
    """
    Request schema for user signup.

    Attributes:
        email: User's email address (validated)
        password: User's password (min 8 characters)
        name: User's display name (max 100 characters)
    """

    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, description="Password (minimum 8 characters)")
    name: str = Field(..., max_length=100, description="User's display name")

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
    """

    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")


class CreateTaskRequest(BaseModel):
    """
    Request schema for creating a task.

    Attributes:
        title: Task title (required, max 200 characters)
        description: Task description (optional, max 1000 characters)
        priority: Task priority level (low|medium|high, default medium)
        due_date: Due date for task completion (ISO 8601 format, optional)
        tags: Tags for task categorization (optional array)
    """

    title: str = Field(..., min_length=1, max_length=200, description="Task title (1-200 characters)")
    description: Optional[str] = Field(default=None, max_length=1000, description="Task description (max 1000 characters)")
    priority: str = Field(default="medium", description="Task priority level (low|medium|high)")
    due_date: Optional[datetime] = Field(default=None, description="Due date in ISO 8601 format")
    tags: Optional[List[str]] = Field(default=[], description="Array of tags for task categorization")

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        """Validate priority is one of the allowed values."""
        if v not in ["low", "medium", "high"]:
            raise ValueError("Priority must be one of: low, medium, high")
        return v

    @field_validator("due_date")
    @classmethod
    def validate_due_date(cls, v: Optional[datetime]) -> Optional[datetime]:
        """Validate due date is not in the past."""
        if v and v < datetime.utcnow():
            raise ValueError("Due date cannot be in the past")
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: List[str]) -> List[str]:
        """Validate tags array."""
        if len(v) > 10:  # Limit number of tags
            raise ValueError("Maximum 10 tags allowed")
        # Limit individual tag length
        for tag in v:
            if len(tag) > 50:
                raise ValueError("Each tag must be 50 characters or less")
        return v


class UpdateTaskRequest(BaseModel):
    """
    Request schema for updating a task.

    Attributes:
        title: Task title (optional, max 200 characters)
        description: Task description (optional, max 1000 characters)
        priority: Task priority level (optional, low|medium|high)
        due_date: Due date for task completion (ISO 8601 format, optional)
        tags: Tags for task categorization (optional array)
    """

    title: Optional[str] = Field(default=None, min_length=1, max_length=200, description="Task title (1-200 characters)")
    description: Optional[str] = Field(default=None, max_length=1000, description="Task description (max 1000 characters)")
    priority: Optional[str] = Field(default=None, description="Task priority level (low|medium|high)")
    due_date: Optional[datetime] = Field(default=None, description="Due date in ISO 8601 format")
    tags: Optional[List[str]] = Field(default=None, description="Array of tags for task categorization")

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        """Validate priority is one of the allowed values if provided."""
        if v is not None and v not in ["low", "medium", "high"]:
            raise ValueError("Priority must be one of: low, medium, high")
        return v

    @field_validator("due_date")
    @classmethod
    def validate_due_date(cls, v: Optional[datetime]) -> Optional[datetime]:
        """Validate due date is not in the past if provided."""
        if v and v < datetime.utcnow():
            raise ValueError("Due date cannot be in the past")
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate tags array if provided."""
        if v is not None:
            if len(v) > 10:  # Limit number of tags
                raise ValueError("Maximum 10 tags allowed")
            # Limit individual tag length
            for tag in v:
                if len(tag) > 50:
                    raise ValueError("Each tag must be 50 characters or less")
        return v


class ToggleCompleteRequest(BaseModel):
    """
    Request schema for toggling task completion status.

    Attributes:
        completed: New completion status
    """

    completed: bool = Field(..., description="Task completion status")


class BulkOperationRequest(BaseModel):
    """
    Request schema for bulk operations on tasks.

    Attributes:
        action: Bulk operation type (delete|complete|pending|priority)
        task_ids: List of task IDs to operate on
        priority: New priority level (required only for action='priority')
    """

    action: str = Field(..., description="Bulk operation type: delete, complete, pending, or priority")
    task_ids: List[int] = Field(..., min_length=1, description="List of task IDs (at least 1 required)")
    priority: Optional[str] = Field(default=None, description="Priority level for action='priority' (low|medium|high)")

    @field_validator("action")
    @classmethod
    def validate_action(cls, v: str) -> str:
        """Validate action is one of the allowed values."""
        if v not in ["delete", "complete", "pending", "priority"]:
            raise ValueError("Action must be one of: delete, complete, pending, priority")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str], info) -> Optional[str]:
        """Validate priority is provided for priority action and is valid."""
        # Get action from values dict
        action = info.data.get('action')

        if action == "priority":
            if v is None:
                raise ValueError("Priority is required for action='priority'")
            if v not in ["low", "medium", "high"]:
                raise ValueError("Priority must be one of: low, medium, high")

        return v

    @field_validator("task_ids")
    @classmethod
    def validate_task_ids(cls, v: List[int]) -> List[int]:
        """Validate task IDs list is not empty and contains valid IDs."""
        if not v:
            raise ValueError("At least one task ID is required")

        if len(v) > 100:
            raise ValueError("Maximum 100 tasks allowed per bulk operation")

        for task_id in v:
            if task_id < 1:
                raise ValueError(f"Invalid task ID: {task_id}")

        return v
