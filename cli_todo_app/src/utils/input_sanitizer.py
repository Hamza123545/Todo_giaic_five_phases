"""Input sanitization utilities for preventing command injection and ensuring safe terminal output."""

import re
from typing import Optional

# Whitelist: alphanumeric, spaces, and safe punctuation
SAFE_CHAR_PATTERN = re.compile(r'^[A-Za-z0-9\s.,\-\'?!]+$')

# Shell metacharacters that need escaping
SHELL_METACHARACTERS = ['$', '`', ';', '|', '&', '>', '<', '\\', '\n', '\r', '\t', '(', ')', '[', ']', '{', '}', '*', '?', '"', "'"]

def sanitize_input(text: str, max_length: int = 500) -> str:
    """
    Sanitize user input to prevent command injection and terminal corruption.
    
    Args:
        text: User-provided string (task title or description)
        max_length: Maximum allowed length (default 500 characters)
    
    Returns:
        Sanitized string safe for storage and display
        
    Raises:
        ValueError: If input contains disallowed characters or exceeds max_length
    """
    if not text:
        raise ValueError("Input cannot be empty")
    
    if len(text) > max_length:
        raise ValueError(f"Input exceeds maximum length of {max_length} characters")
    
    # Reject control characters (ASCII 0-31 except space=32)
    for char in text:
        if ord(char) < 32 and ord(char) not in [9, 10]:  # Allow tab and newline
            raise ValueError(f"Input contains disallowed control character (ASCII {ord(char)})")
    
    # Validate against whitelist
    if not SAFE_CHAR_PATTERN.match(text):
        raise ValueError("Input contains disallowed characters. Only letters, numbers, spaces, and basic punctuation (.,?!'-) are allowed")
    
    # Return the validated input (whitelist approach - no escaping needed)
    return text
