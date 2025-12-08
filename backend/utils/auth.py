"""
JWT authentication utilities for token generation and verification.

This module provides functions for generating and verifying JWT tokens
using the Better Auth shared secret.
"""

import os
from datetime import datetime, timedelta
from typing import Dict

from jose import jwt

# Get shared secret from environment (MUST match frontend Better Auth secret)
BETTER_AUTH_SECRET = os.getenv("BETTER_AUTH_SECRET")

if not BETTER_AUTH_SECRET:
    raise ValueError("BETTER_AUTH_SECRET environment variable is required")

# JWT configuration
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = int(os.getenv("JWT_EXPIRATION_DAYS", "7"))


def generate_jwt_token(user_id: str, email: str) -> str:
    """
    Generate JWT token for authenticated user.

    Args:
        user_id: User's unique identifier (UUID as string)
        email: User's email address

    Returns:
        str: JWT token string

    Example:
        >>> token = generate_jwt_token("123e4567-e89b-12d3-a456-426614174000", "user@example.com")
        >>> print(token[:10])
        eyJhbGciO
    """
    # Calculate expiration time
    expiration = datetime.utcnow() + timedelta(days=JWT_EXPIRATION_DAYS)

    # Create payload with standard JWT claims
    payload = {
        "sub": user_id,  # Standard JWT subject claim
        "user_id": user_id,  # Also include for compatibility
        "email": email,
        "exp": expiration,  # Expiration timestamp
        "iat": datetime.utcnow(),  # Issued at timestamp
    }

    # Encode token with shared secret
    token = jwt.encode(payload, BETTER_AUTH_SECRET, algorithm=JWT_ALGORITHM)

    return token


def verify_jwt_token(token: str) -> Dict[str, str]:
    """
    Verify JWT token and extract user information.

    Args:
        token: JWT token string to verify

    Returns:
        dict: {"user_id": str, "email": str}

    Raises:
        jose.JWTError: If token is invalid or expired

    Example:
        >>> token = generate_jwt_token("123e4567-e89b-12d3-a456-426614174000", "user@example.com")
        >>> payload = verify_jwt_token(token)
        >>> print(payload["user_id"])
        123e4567-e89b-12d3-a456-426614174000
    """
    # Decode and verify token
    payload = jwt.decode(token, BETTER_AUTH_SECRET, algorithms=[JWT_ALGORITHM])

    # Extract user information
    user_id: str = payload.get("sub") or payload.get("user_id")
    email: str = payload.get("email")

    if not user_id:
        raise ValueError("Invalid token: missing user_id")

    return {"user_id": user_id, "email": email or ""}
