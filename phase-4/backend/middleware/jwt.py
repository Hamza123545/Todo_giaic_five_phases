"""
JWT authentication middleware for token verification.

This module provides dependency functions for verifying JWT tokens
and extracting user information from authenticated requests.
"""

from typing import Dict

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt.exceptions

from utils.auth import verify_jwt_token as verify_token

# HTTP Bearer token scheme for extracting tokens from Authorization header
security = HTTPBearer()


def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, str]:
    """
    Verify JWT token and extract user information.

    This dependency function extracts the JWT token from the Authorization header,
    verifies it using the Better Auth shared secret, and returns the user information.

    Args:
        credentials: HTTP Authorization credentials with Bearer token

    Returns:
        dict: {"user_id": str, "email": str}

    Raises:
        HTTPException: 401 if token is invalid, expired, or missing

    Example:
        @app.get("/api/{user_id}/tasks")
        async def get_tasks(
            user_id: str,
            current_user: Dict = Depends(verify_jwt_token)
        ):
            # Verify user_id matches
            if current_user["user_id"] != user_id:
                raise HTTPException(status_code=403, detail="User ID mismatch")
            # ... rest of endpoint logic
    """
    token = credentials.credentials

    try:
        # Verify token and extract user information (uses JWKS)
        user_info = verify_token(token)
        return user_info

    except jwt.exceptions.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {"code": "TOKEN_EXPIRED", "message": "Token has expired. Please sign in again."},
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    except jwt.exceptions.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {"code": "INVALID_TOKEN", "message": "Invalid token"},
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {"code": "TOKEN_ERROR", "message": str(e)},
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {"code": "TOKEN_VERIFICATION_FAILED", "message": f"Token verification failed: {str(e)}"},
            },
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_user_access(user_id: str, current_user: Dict[str, str] = Depends(verify_jwt_token)) -> Dict[str, str]:
    """
    Verify that authenticated user has access to the requested user_id.

    This dependency function verifies that the user_id from the JWT token
    matches the user_id in the URL path, enforcing user isolation.

    Args:
        user_id: User ID from URL path
        current_user: User information from JWT token

    Returns:
        dict: User information from JWT token

    Raises:
        HTTPException: 403 if user_id mismatch

    Example:
        @app.get("/api/{user_id}/tasks")
        async def get_tasks(
            user_id: str,
            current_user: Dict = Depends(verify_user_access)
        ):
            # User is verified, proceed with request
            # ... endpoint logic
    """
    if current_user["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID mismatch: You can only access your own data",
        )

    return current_user
