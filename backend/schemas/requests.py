"""
Request schemas for API endpoints.

This module defines Pydantic models for validating incoming requests.
"""

from typing import Optional

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
