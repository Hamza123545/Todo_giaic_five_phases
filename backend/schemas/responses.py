"""
Response schemas for API endpoints.

This module defines Pydantic models for API responses.
"""

from datetime import datetime
from typing import Any, Dict, Optional
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
