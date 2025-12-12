"""
Query parameter schemas for API endpoints.

This module defines Pydantic models for validating query parameters.
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


class TaskQueryParams(BaseModel):
    """
    Query parameters for task listing endpoint.

    Supports filtering, sorting, search, and pagination.

    Attributes:
        status: Filter by completion status (all, pending, completed)
        priority: Filter by priority level (low, medium, high)
        due_date_from: Filter tasks with due date from this date (ISO 8601)
        due_date_to: Filter tasks with due date until this date (ISO 8601)
        tags: Comma-separated list of tags to filter by
        sort: Sort order (format: field:direction, e.g., "created:desc")
        search: Search keyword for title and description
        page: Page number for pagination (starts at 1)
        limit: Number of items per page (1-100)
    """

    # Filtering parameters
    status: Optional[Literal["all", "pending", "completed"]] = Field(
        default="all",
        description="Filter by completion status",
    )
    priority: Optional[Literal["low", "medium", "high"]] = Field(
        default=None,
        description="Filter by priority level",
    )
    due_date_from: Optional[str] = Field(
        default=None,
        description="Filter tasks with due date from this date (ISO 8601 format: YYYY-MM-DD)",
    )
    due_date_to: Optional[str] = Field(
        default=None,
        description="Filter tasks with due date until this date (ISO 8601 format: YYYY-MM-DD)",
    )
    tags: Optional[str] = Field(
        default=None,
        description="Comma-separated list of tags to filter by (e.g., 'work,urgent')",
    )

    # Sorting parameters
    sort: Optional[str] = Field(
        default="created:desc",
        description="Sort order (format: field:direction). "
        "Fields: created, title, updated, priority, due_date. "
        "Directions: asc, desc. Example: 'priority:asc' or 'created:desc'",
    )

    # Search parameters
    search: Optional[str] = Field(
        default=None,
        description="Search keyword for title and description (full-text search with partial matches)",
    )

    # Pagination parameters
    page: int = Field(
        default=1,
        ge=1,
        description="Page number for pagination (starts at 1)",
    )
    limit: int = Field(
        default=50,
        ge=1,
        le=100,
        description="Number of items per page (1-100)",
    )

    @field_validator("due_date_from")
    @classmethod
    def validate_due_date_from(cls, v: Optional[str]) -> Optional[datetime]:
        """Validate due_date_from is a valid ISO 8601 date."""
        if v is None:
            return None
        try:
            # Try to parse as datetime
            parsed = datetime.fromisoformat(v.replace("Z", "+00:00"))
            return parsed
        except (ValueError, AttributeError):
            raise ValueError(
                "due_date_from must be a valid ISO 8601 date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)"
            )

    @field_validator("due_date_to")
    @classmethod
    def validate_due_date_to(cls, v: Optional[str]) -> Optional[datetime]:
        """Validate due_date_to is a valid ISO 8601 date."""
        if v is None:
            return None
        try:
            # Try to parse as datetime
            parsed = datetime.fromisoformat(v.replace("Z", "+00:00"))
            return parsed
        except (ValueError, AttributeError):
            raise ValueError(
                "due_date_to must be a valid ISO 8601 date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)"
            )

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[str]) -> Optional[list[str]]:
        """Parse comma-separated tags."""
        if v is None:
            return None
        # Split by comma and strip whitespace
        tags = [tag.strip() for tag in v.split(",") if tag.strip()]
        return tags if tags else None

    @field_validator("sort")
    @classmethod
    def validate_sort(cls, v: str) -> str:
        """Validate sort parameter format and values."""
        valid_fields = ["created", "title", "updated", "priority", "due_date"]
        valid_directions = ["asc", "desc"]

        # Parse sort parameter
        if ":" not in v:
            raise ValueError(
                "Sort parameter must be in format 'field:direction'. Example: 'created:desc'"
            )

        field, direction = v.split(":", 1)

        # Validate field
        if field not in valid_fields:
            raise ValueError(
                f"Invalid sort field '{field}'. Must be one of: {', '.join(valid_fields)}"
            )

        # Validate direction
        if direction not in valid_directions:
            raise ValueError(
                f"Invalid sort direction '{direction}'. Must be one of: {', '.join(valid_directions)}"
            )

        # Return as string (will be parsed in service layer)
        return v

    @field_validator("search")
    @classmethod
    def validate_search(cls, v: Optional[str]) -> Optional[str]:
        """Validate search keyword."""
        if v is None:
            return None
        # Strip whitespace and ensure it's not empty
        search = v.strip()
        if not search:
            return None
        # Limit search length to prevent abuse
        if len(search) > 200:
            raise ValueError("Search keyword must be at most 200 characters")
        return search

    class Config:
        """Pydantic config."""

        # Allow field validation
        validate_assignment = True
