"""
Response schemas for API endpoints.

This module defines Pydantic models for API responses.
"""

from datetime import datetime
from typing import Any, Dict, Optional
# Removed UUID import - Better Auth uses string IDs

from pydantic import BaseModel, Field


class UserResponse(BaseModel):
    """
    User information response schema.

    Attributes:
        id: User's unique identifier
        email: User's email address
        name: User's display name
        created_at: Account creation timestamp
        updated_at: Last update timestamp
    """

    id: str  # Better Auth uses string IDs
    email: str
    name: str
    created_at: datetime
    updated_at: datetime


class AuthResponse(BaseModel):
    """
    Authentication response schema with token and user data.

    Attributes:
        success: Operation success status
        data: Contains token and user information
    """

    success: bool = Field(default=True)
    data: Dict[str, Any] = Field(
        ...,
        description="Contains 'token' (JWT string) and 'user' (UserResponse)",
    )


class ErrorResponse(BaseModel):
    """
    Standard error response schema.

    Attributes:
        success: Always False for errors
        error: Error details including code, message, and optional details
    """

    success: bool = Field(default=False)
    error: Dict[str, Any] = Field(
        ...,
        description="Contains 'code', 'message', and optional 'details'",
    )


class SuccessResponse(BaseModel):
    """
    Generic success response schema.

    Attributes:
        success: Always True for success
        message: Optional success message
    """

    success: bool = Field(default=True)
    message: Optional[str] = Field(default=None)


class TaskResponse(BaseModel):
    """
    Task response schema.

    Attributes:
        id: Task unique identifier
        user_id: Owner of the task
        title: Task title
        description: Task description
        priority: Task priority level (low|medium|high)
        due_date: Due date for task completion
        tags: Tags for task categorization
        completed: Completion status
        created_at: Task creation timestamp
        updated_at: Last update timestamp
    """

    id: int
    user_id: str  # Better Auth uses string IDs
    title: str
    description: Optional[str] = None
    priority: str
    due_date: Optional[datetime] = None
    tags: Optional[list[str]] = None
    completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaginationMeta(BaseModel):
    """
    Pagination metadata.

    Attributes:
        total: Total number of items
        page: Current page number
        limit: Number of items per page
        totalPages: Total number of pages
    """

    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    limit: int = Field(..., description="Number of items per page")
    totalPages: int = Field(..., description="Total number of pages")


class TaskListResponse(BaseModel):
    """
    Response schema for task list endpoint with pagination.

    Attributes:
        success: Operation success status
        data: Paginated task data with items and pagination info
    """

    success: bool = Field(default=True)
    data: Dict[str, Any] = Field(
        description="Paginated task data with items, total, page, limit, totalPages"
    )


class SingleTaskResponse(BaseModel):
    """
    Response schema for single task operations.

    Attributes:
        success: Operation success status
        data: Task data
    """

    success: bool = Field(default=True)
    data: TaskResponse


class DeleteTaskResponse(BaseModel):
    """
    Response schema for task deletion.

    Attributes:
        success: Operation success status
        message: Success message
    """

    success: bool = Field(default=True)
    message: str = Field(default="Task deleted successfully")
