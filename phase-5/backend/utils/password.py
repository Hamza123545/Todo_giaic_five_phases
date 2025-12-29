"""
Password hashing and verification utilities using bcrypt.

This module provides secure password hashing and verification functions
using bcrypt directly for maximum compatibility.
"""

import bcrypt


def hash_password(password: str) -> str:
    """
    Hash password using bcrypt.

    Args:
        password: Plain text password to hash

    Returns:
        str: Hashed password string

    Example:
        >>> hashed = hash_password("securepassword123")
        >>> print(hashed[:4])
        $2b$
    """
    # Encode password to bytes
    password_bytes = password.encode('utf-8')

    # Generate salt and hash password
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)

    # Return as string
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify plain password against hashed password.

    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password from database

    Returns:
        bool: True if password matches, False otherwise

    Example:
        >>> hashed = hash_password("securepassword123")
        >>> verify_password("securepassword123", hashed)
        True
        >>> verify_password("wrongpassword", hashed)
        False
    """
    try:
        # Encode both to bytes
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')

        # Verify password
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False
