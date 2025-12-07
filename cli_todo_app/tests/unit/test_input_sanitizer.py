"""Tests for input sanitization utilities."""

import pytest
from src.utils.input_sanitizer import sanitize_input


class TestSanitizeInput:
    """Test suite for the sanitize_input function."""

    def test_sanitize_valid_input(self):
        """Test that valid input passes through correctly."""
        assert sanitize_input("Buy groceries") == "Buy groceries"
        assert sanitize_input("Read The Martian!") == "Read The Martian!"
        assert sanitize_input("Task with numbers 123") == "Task with numbers 123"
        assert sanitize_input("Multiple words, with punctuation.") == "Multiple words, with punctuation."

    def test_sanitize_with_apostrophe(self):
        """Test that apostrophes are allowed."""
        assert sanitize_input("Don't forget") == "Don't forget"
        assert sanitize_input("It's working") == "It's working"

    def test_sanitize_with_hyphen(self):
        """Test that hyphens are allowed."""
        assert sanitize_input("Test-driven development") == "Test-driven development"
        assert sanitize_input("Up-to-date") == "Up-to-date"

    def test_sanitize_with_question_mark(self):
        """Test that question marks are allowed."""
        assert sanitize_input("Is this working?") == "Is this working?"

    def test_sanitize_rejects_shell_metacharacters_dollar(self):
        """Test rejection of dollar sign shell metacharacter."""
        with pytest.raises(ValueError, match="disallowed characters"):
            sanitize_input("Task with $variable")

    def test_sanitize_rejects_shell_metacharacters_backtick(self):
        """Test rejection of backtick shell metacharacter."""
        with pytest.raises(ValueError, match="disallowed characters"):
            sanitize_input("Task with `command`")

    def test_sanitize_rejects_shell_metacharacters_semicolon(self):
        """Test rejection of semicolon shell metacharacter."""
        with pytest.raises(ValueError, match="disallowed characters"):
            sanitize_input("Task; rm -rf /")

    def test_sanitize_rejects_shell_metacharacters_pipe(self):
        """Test rejection of pipe shell metacharacter."""
        with pytest.raises(ValueError, match="disallowed characters"):
            sanitize_input("Task | grep something")

    def test_sanitize_rejects_shell_metacharacters_ampersand(self):
        """Test rejection of ampersand shell metacharacter."""
        with pytest.raises(ValueError, match="disallowed characters"):
            sanitize_input("Task && echo test")

    def test_sanitize_rejects_shell_metacharacters_redirect(self):
        """Test rejection of redirect shell metacharacters."""
        with pytest.raises(ValueError, match="disallowed characters"):
            sanitize_input("Task > output.txt")
        with pytest.raises(ValueError, match="disallowed characters"):
            sanitize_input("Task < input.txt")

    def test_sanitize_rejects_control_character_null_byte(self):
        """Test rejection of null byte control character."""
        with pytest.raises(ValueError, match="control character"):
            sanitize_input("Task with \x00 null byte")

    def test_sanitize_rejects_control_character_escape(self):
        """Test rejection of escape control character."""
        with pytest.raises(ValueError, match="control character"):
            sanitize_input("Task with \x1b escape")

    def test_sanitize_rejects_control_character_bell(self):
        """Test rejection of bell control character."""
        with pytest.raises(ValueError, match="control character"):
            sanitize_input("Task with \x07 bell")

    def test_sanitize_rejects_various_control_characters(self):
        """Test rejection of various control characters (ASCII 0-31)."""
        # Test a few control characters
        for ascii_code in [0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]:
            with pytest.raises(ValueError, match="control character"):
                sanitize_input(f"Task with {chr(ascii_code)} character")

    def test_sanitize_max_length_enforcement(self):
        """Test maximum length enforcement."""
        long_input = "A" * 501
        with pytest.raises(ValueError, match="exceeds maximum length"):
            sanitize_input(long_input)

    def test_sanitize_max_length_boundary(self):
        """Test that max length boundary works correctly."""
        # Should pass at exactly 500 characters
        valid_input = "A" * 500
        assert sanitize_input(valid_input) == valid_input

    def test_sanitize_empty_input(self):
        """Test empty input rejection."""
        with pytest.raises(ValueError, match="cannot be empty"):
            sanitize_input("")

    def test_sanitize_custom_max_length(self):
        """Test custom max length parameter."""
        short_input = "A" * 11
        with pytest.raises(ValueError, match="exceeds maximum length"):
            sanitize_input(short_input, max_length=10)

    def test_sanitize_rejects_special_characters(self):
        """Test rejection of various special characters not in whitelist."""
        special_chars = ['@', '#', '%', '^', '*', '(', ')', '[', ']', '{', '}', '\\', '/', '~', '=', '+']
        for char in special_chars:
            with pytest.raises(ValueError, match="disallowed characters"):
                sanitize_input(f"Task with {char} character")

    def test_sanitize_rejects_double_quotes(self):
        """Test rejection of double quotes."""
        with pytest.raises(ValueError, match="disallowed characters"):
            sanitize_input('Task with "quotes"')

    def test_sanitize_allows_single_quotes_in_whitelist(self):
        """Test that single quotes in the whitelist pattern are allowed."""
        # Single quotes (apostrophes) should be allowed
        assert sanitize_input("It's a test") == "It's a test"
