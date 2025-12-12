"""
JWT verification for Better Auth tokens.

This module provides JWT verification using the JWKS endpoint from Better Auth
and extracts the user ID from the token's 'sub' claim.

Note: This replaces the previous HS256 shared secret approach with JWKS
to match Better Auth's JWT plugin token generation.
"""

import jwt
from jwt import PyJWKClient
from typing import Dict
from functools import lru_cache
from config import settings

# Keep generate_jwt_token for backward compatibility (tests may use it)
# But note: Better Auth generates tokens, not the backend
# This function is only for testing purposes
def generate_jwt_token(user_id: str, email: str) -> str:
    """
    Generate JWT token for testing purposes only.
    
    Note: In production, Better Auth generates tokens. This function
    is kept for backward compatibility with tests but should not be
    used in production code.
    
    Args:
        user_id: User's unique identifier
        email: User's email address
    
    Returns:
        str: JWT token string (deprecated - use Better Auth instead)
    """
    import os
    from datetime import datetime, timedelta
    from jose import jwt
    
    BETTER_AUTH_SECRET = os.getenv("BETTER_AUTH_SECRET")
    if not BETTER_AUTH_SECRET:
        raise ValueError("BETTER_AUTH_SECRET environment variable is required")
    
    expiration = datetime.utcnow() + timedelta(days=7)
    payload = {
        "sub": user_id,
        "user_id": user_id,
        "email": email,
        "exp": expiration,
        "iat": datetime.utcnow(),
    }
    
    # Note: This uses HS256 for test compatibility, but Better Auth uses EdDSA/RS256
    return jwt.encode(payload, BETTER_AUTH_SECRET, algorithm="HS256")


def get_jwk_client() -> PyJWKClient:
    """
    Get a cached PyJWKClient for JWKS verification.

    The client fetches public keys from Better Auth's JWKS endpoint
    and caches them for efficient verification.

    Returns:
        PyJWKClient: Configured JWKS client
    """
    jwks_url = f"{settings.better_auth_url}/api/auth/jwks"
    return PyJWKClient(jwks_url)


@lru_cache(maxsize=1)
def _get_cached_jwk_client() -> PyJWKClient:
    """Cached version of JWKS client."""
    return get_jwk_client()


def verify_jwt_token(token: str) -> Dict[str, str]:
    """
    Verify JWT token and extract user information using JWKS.

    This function extracts the JWT token, verifies its signature using JWKS,
    and returns the user information from the 'sub' claim.

    Args:
        token: JWT token string to verify

    Returns:
        dict: {"user_id": str, "email": str}

    Raises:
        jwt.exceptions.PyJWTError: If token is invalid or expired
        ValueError: If token is missing user ID

    Example:
        >>> token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
        >>> payload = verify_jwt_token(token)
        >>> print(payload["user_id"])
        123e4567-e89b-12d3-a456-426614174000
    """
    try:
        # Get JWKS client and signing key
        jwk_client = _get_cached_jwk_client()
        signing_key = jwk_client.get_signing_key_from_jwt(token)

        # Verify and decode the JWT
        # Better Auth uses EdDSA (Ed25519) or RS256 by default
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["EdDSA", "RS256"],
            options={"verify_aud": False}  # Better Auth doesn't use audience claim
        )

        # Extract user information from token
        user_id: str = payload.get("sub") or payload.get("user_id")
        email: str = payload.get("email", "")

        if not user_id:
            raise ValueError("Invalid token: missing user_id (sub claim)")

        return {"user_id": user_id, "email": email}

    except jwt.exceptions.PyJWTError as e:
        # Log the error for debugging
        import logging
        logger = logging.getLogger("todo_api")
        logger.error(f"JWT verification error: {str(e)}", exc_info=True)
        # Re-raise with more context
        raise ValueError(f"Invalid token: {str(e)}") from e
    except Exception as e:
        # Log any other unexpected errors
        import logging
        logger = logging.getLogger("todo_api")
        logger.error(f"Unexpected error in verify_jwt_token: {str(e)}", exc_info=True)
        raise ValueError(f"Token verification failed: {str(e)}") from e
