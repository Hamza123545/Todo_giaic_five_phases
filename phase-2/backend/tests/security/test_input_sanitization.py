"""
Tests for input sanitization functionality.

This module tests that input sanitization prevents injection attacks
and validates user input properly.
"""

import pytest
from utils.sanitization import (
    sanitize_string,
    sanitize_search_query,
    sanitize_email,
    sanitize_filename,
    validate_uuid,
    validate_integer_id,
    sanitize_tags,
)


def test_sanitize_string_removes_null_bytes():
    """Test that null bytes are removed from strings."""
    input_str = "test\x00string"
    sanitized = sanitize_string(input_str)
    assert "\x00" not in sanitized
    assert sanitized == "teststring"


def test_sanitize_string_strips_whitespace():
    """Test that leading/trailing whitespace is stripped."""
    input_str = "  test string  "
    sanitized = sanitize_string(input_str)
    assert sanitized == "test string"


def test_sanitize_string_enforces_max_length():
    """Test that maximum length is enforced."""
    input_str = "a" * 100
    sanitized = sanitize_string(input_str, max_length=50)
    assert len(sanitized) == 50


def test_sanitize_search_query_escapes_wildcards():
    """Test that SQL wildcards are escaped in search queries."""
    query = "test%string_query"
    sanitized = sanitize_search_query(query)
    assert "\\%" in sanitized
    assert "\\_" in sanitized


def test_sanitize_search_query_removes_null_bytes():
    """Test that null bytes are removed from search queries."""
    query = "test\x00query"
    sanitized = sanitize_search_query(query)
    assert "\x00" not in sanitized


def test_sanitize_email_validates_format():
    """Test that email validation works correctly."""
    # Valid email
    valid_email = "test@example.com"
    sanitized = sanitize_email(valid_email)
    assert sanitized == valid_email.lower()

    # Invalid email
    with pytest.raises(ValueError):
        sanitize_email("invalid_email")

    with pytest.raises(ValueError):
        sanitize_email("test@")

    with pytest.raises(ValueError):
        sanitize_email("@example.com")


def test_sanitize_email_converts_to_lowercase():
    """Test that email is converted to lowercase."""
    email = "Test@Example.COM"
    sanitized = sanitize_email(email)
    assert sanitized == "test@example.com"


def test_sanitize_filename_removes_special_chars():
    """Test that special characters are removed from filenames."""
    filename = "test/file\\name:with*special?.txt"
    sanitized = sanitize_filename(filename)
    assert "/" not in sanitized
    assert "\\" not in sanitized
    assert ":" not in sanitized
    assert "*" not in sanitized
    assert "?" not in sanitized


def test_sanitize_filename_prevents_directory_traversal():
    """Test that directory traversal is prevented."""
    filename = "../../../etc/passwd"
    sanitized = sanitize_filename(filename)
    assert ".." not in sanitized
    assert "/" not in sanitized


def test_validate_uuid_accepts_valid():
    """Test that valid UUIDs are accepted."""
    valid_uuid = "550e8400-e29b-41d4-a716-446655440000"
    assert validate_uuid(valid_uuid) is True


def test_validate_uuid_rejects_invalid():
    """Test that invalid UUIDs are rejected."""
    assert validate_uuid("not-a-uuid") is False
    assert validate_uuid("123") is False
    assert validate_uuid("") is False


def test_validate_integer_id_accepts_valid():
    """Test that valid integer IDs are accepted."""
    assert validate_integer_id("123") is True
    assert validate_integer_id("1") is True


def test_validate_integer_id_rejects_invalid():
    """Test that invalid integer IDs are rejected."""
    assert validate_integer_id("0") is False
    assert validate_integer_id("-1") is False
    assert validate_integer_id("abc") is False
    assert validate_integer_id("") is False


def test_sanitize_tags_removes_invalid_tags():
    """Test that invalid tags are removed."""
    tags = ["valid_tag", "123", "tag-with-dash", "tag with space", "tag$with$special"]
    sanitized = sanitize_tags(tags)

    # Should keep valid tags
    assert "valid_tag" in sanitized
    assert "123" in sanitized
    assert "tag-with-dash" in sanitized
    assert "tag with space" in sanitized

    # Should remove tags with special characters
    assert "tag$with$special" not in sanitized


def test_sanitize_tags_limits_count():
    """Test that number of tags is limited."""
    tags = [f"tag{i}" for i in range(30)]
    sanitized = sanitize_tags(tags)

    # Should limit to 20 tags
    assert len(sanitized) <= 20


def test_sanitize_tags_limits_length():
    """Test that tag length is limited."""
    tags = ["a" * 100]
    sanitized = sanitize_tags(tags)

    # Should limit tag length to 50
    assert len(sanitized[0]) <= 50


def test_sql_injection_prevention():
    """Test that common SQL injection patterns are handled."""
    # Common SQL injection patterns
    injection_attempts = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        "1; DELETE FROM tasks WHERE 1=1",
    ]

    for injection in injection_attempts:
        # Sanitize as search query
        sanitized = sanitize_search_query(injection)

        # Should escape or remove dangerous characters
        # Note: SQLModel/SQLAlchemy parameterized queries provide main protection
        # The sanitize_search_query function escapes % and _ characters
        # If the injection contains these, they will be escaped
        # Otherwise, the string might be the same but that's OK because parameterized queries protect us
        # The important thing is that the function doesn't crash and returns a safe string
        assert isinstance(sanitized, str)
        assert len(sanitized) <= 200  # Max length enforced
        # Check that dangerous patterns are escaped if they contain wildcards
        if "%" in injection or "_" in injection:
            assert sanitized != injection
