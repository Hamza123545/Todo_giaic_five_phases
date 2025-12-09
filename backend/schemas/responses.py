"""
Response schemas for API endpoints.

This module defines Pydantic models for API responses.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

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

    id: UUID
    email: str
    name: str
    created_at: datetime
    updated_at: datetime


class TaskResponse(BaseModel):
    """
    Task information response schema.

    Attributes:
        id: Task's unique identifier
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
    user_id: UUID
    title: str
    description: Optional[str]
    priority: str
    due_date: Optional[datetime]
    tags: List[str]
    completed: bool
    created_at: datetime
    updated_at: datetime


class TaskListResponse(BaseModel):
    """
    Task list response schema with pagination metadata.

    Attributes:
        data: List of task objects
        meta: Pagination metadata
        success: Operation success status
    """

    data: List[TaskResponse]
    meta: Dict[str, Any] = Field(
        ...,
        description="Contains 'total', 'page', 'limit', 'totalPages'",
    )
    success: bool = Field(default=True)


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


class ImportResult(BaseModel):
    """
    Import result data schema.

    Attributes:
        imported: Number of tasks successfully imported
        errors: Number of tasks with errors
        errors_list: List of error messages (optional)
    """

    imported: int
    errors: int
    errors_list: Optional[List[str]] = Field(default=None)


class ImportResponse(BaseModel):
    """
    Response schema for task import endpoint.

    Attributes:
        success: Always True for success
        data: Import result data
    """

    success: bool = Field(default=True)
    data: ImportResult


class StatisticsData(BaseModel):
    """
    Task statistics data schema.

    Attributes:
        total: Total number of tasks
        completed: Number of completed tasks
        pending: Number of pending tasks
        overdue: Number of overdue tasks
    """

    total: int
    completed: int
    pending: int
    overdue: int


class StatisticsResponse(BaseModel):
    """
    Response schema for task statistics endpoint.

    Attributes:
        success: Always True for success
        data: Statistics data
    """

    success: bool = Field(default=True)
    data: StatisticsData


class BulkOperationData(BaseModel):
    """
    Bulk operation result data schema.

    Attributes:
        affected: Number of tasks affected by the operation
    """

    affected: int


class BulkOperationResponse(BaseModel):
    """
    Response schema for bulk operations endpoint.

    Attributes:
        success: Always True for success
        data: Bulk operation result data
    """

    success: bool = Field(default=True)
    data: BulkOperationData
