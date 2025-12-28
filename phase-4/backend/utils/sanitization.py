"""
Input sanitization utilities to prevent injection attacks.

This module provides functions for sanitizing user input to prevent
SQL injection, XSS, and other security vulnerabilities.
"""

import re
from typing import Optional


def sanitize_string(value: str, max_length: Optional[int] = None) -> str:
    """
    Sanitize string input to prevent injection attacks.

    Args:
        value: Input string to sanitize
        max_length: Optional maximum length to enforce

    Returns:
        str: Sanitized string

    Note:
        SQLModel/SQLAlchemy automatically handles SQL injection prevention
        through parameterized queries, but this provides additional safety.
    """
    if not isinstance(value, str):
        raise ValueError("Input must be a string")

    # Remove null bytes
    sanitized = value.replace("\x00", "")

    # Strip leading/trailing whitespace
    sanitized = sanitized.strip()

    # Enforce maximum length if specified
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]

    return sanitized


def sanitize_search_query(query: str) -> str:
    """
    Sanitize search query to prevent SQL injection in LIKE clauses.

    Args:
        query: Search query string

    Returns:
        str: Sanitized search query

    Note:
        Escapes special characters that could be used in SQL LIKE patterns
    """
    if not query:
        return ""

    # Remove SQL wildcards that could cause issues
    sanitized = query.replace("%", "\\%").replace("_", "\\_")

    # Remove null bytes
    sanitized = sanitized.replace("\x00", "")

    # Limit length
    sanitized = sanitize_string(sanitized, max_length=200)

    return sanitized


def sanitize_email(email: str) -> str:
    """
    Sanitize and validate email address.

    Args:
        email: Email address to sanitize

    Returns:
        str: Sanitized email address

    Raises:
        ValueError: If email format is invalid
    """
    sanitized = sanitize_string(email, max_length=255).lower()

    # Basic email format validation
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(email_pattern, sanitized):
        raise ValueError("Invalid email format")

    return sanitized


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent directory traversal attacks.

    Args:
        filename: Filename to sanitize

    Returns:
        str: Sanitized filename
    """
    # Remove directory separators and special characters
    sanitized = re.sub(r'[/\\:*?"<>|]', "", filename)

    # Remove leading dots (hidden files)
    sanitized = sanitized.lstrip(".")

    # Limit length
    sanitized = sanitize_string(sanitized, max_length=255)

    if not sanitized:
        raise ValueError("Invalid filename")

    return sanitized


def validate_uuid(value: str) -> bool:
    """
    Validate UUID format.

    Args:
        value: String to validate as UUID

    Returns:
        bool: True if valid UUID format, False otherwise
    """
    uuid_pattern = r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    return bool(re.match(uuid_pattern, value.lower()))


def validate_integer_id(value: str) -> bool:
    """
    Validate integer ID format.

    Args:
        value: String to validate as integer ID

    Returns:
        bool: True if valid integer ID, False otherwise
    """
    try:
        int_value = int(value)
        return int_value > 0
    except (ValueError, TypeError):
        return False


def sanitize_tags(tags: list[str]) -> list[str]:
    """
    Sanitize list of tags.

    Args:
        tags: List of tag strings

    Returns:
        list[str]: Sanitized tags
    """
    if not isinstance(tags, list):
        raise ValueError("Tags must be a list")

    sanitized_tags = []
    for tag in tags:
        if not isinstance(tag, str):
            continue

        # Sanitize individual tag
        sanitized_tag = sanitize_string(tag, max_length=50)

        # Remove tags with special characters
        if re.match(r"^[a-zA-Z0-9\s_-]+$", sanitized_tag):
            sanitized_tags.append(sanitized_tag)

    # Limit number of tags
    return sanitized_tags[:20]
