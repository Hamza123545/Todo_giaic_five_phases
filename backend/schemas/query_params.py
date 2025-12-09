"""
Query parameter schemas for filtering, sorting, and pagination.

This module defines Pydantic models for query parameters used in API endpoints.
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, validator


class StatusEnum(str, Enum):
    """Enumeration for task status values."""
    all = "all"
    pending = "pending"
    completed = "completed"


class PriorityEnum(str, Enum):
    """Enumeration for task priority values."""
    low = "low"
    medium = "medium"
    high = "high"


class SortFieldEnum(str, Enum):
    """Enumeration for sort field values."""
    created = "created"
    title = "title"
    updated = "updated"
    priority = "priority"
    due_date = "due_date"


class SortDirectionEnum(str, Enum):
    """Enumeration for sort direction values."""
    asc = "asc"
    desc = "desc"


class TaskQueryParams(BaseModel):
    """Query parameters for task filtering, sorting, and pagination."""

    status: Optional[StatusEnum] = StatusEnum.all
    priority: Optional[PriorityEnum] = None
    due_date: Optional[str] = None  # ISO 8601 date format
    tags: Optional[str] = None  # Comma-separated tags
    search: Optional[str] = None  # Search term for title/description
    sort: Optional[SortFieldEnum] = SortFieldEnum.created
    sort_direction: Optional[SortDirectionEnum] = SortDirectionEnum.desc
    page: int = 1
    limit: int = 20

    @validator('page')
    def validate_page(cls, v):
        """Validate page number."""
        if v < 1:
            raise ValueError('Page must be greater than 0')
        return v

    @validator('limit')
    def validate_limit(cls, v):
        """Validate limit value."""
        if v < 1 or v > 100:
            raise ValueError('Limit must be between 1 and 100')
        return v

    @validator('due_date')
    def validate_due_date_format(cls, v):
        """Validate due date format (basic validation)."""
        if v:
            import re
            # Basic ISO date format validation (YYYY-MM-DD)
            pattern = r'^\d{4}-\d{2}-\d{2}$'
            if not re.match(pattern, v):
                raise ValueError('Due date must be in YYYY-MM-DD format')
        return v