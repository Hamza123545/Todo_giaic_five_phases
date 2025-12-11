"""
Authentication routes for user signup, signin, and signout.

This module implements the authentication API endpoints following
the contracts defined in specs/003-backend-todo-app/contracts/api-contracts.md
"""

from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from db import get_session
from middleware.jwt import verify_jwt_token
from schemas.requests import SigninRequest, SignupRequest
from services.auth_service import AuthService
from utils.auth import generate_jwt_token

# Create router with /api/auth prefix
router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Initialize auth service
auth_service = AuthService()


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user_data: SignupRequest, db: Session = Depends(get_session)):
    """
    Create new user account and return JWT token.

    Request Body:
        - email: User's email address (validated)
        - password: Password (minimum 8 characters)
        - name: User's display name (max 100 characters)

    Returns:
        201: {
            "success": true,
            "data": {
                "token": "eyJhbGci...",
                "user": {
                    "id": "uuid-string",
                    "email": "user@example.com",
                    "name": "John Doe",
                    "created_at": "2023-12-08T10:00:00Z",
                    "updated_at": "2023-12-08T10:00:00Z"
                }
            }
        }

    Raises:
        400: Validation error (invalid email, weak password)
        409: Email already exists
        500: Internal server error
    """
    try:
        # Create user
        user = auth_service.create_user(
            db=db, email=user_data.email, password=user_data.password, name=user_data.name
        )

        # Generate JWT token
        token = generate_jwt_token(str(user.id), user.email)

        # Return success response with token and user data
        return {
            "success": True,
            "data": {
                "token": token,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "name": user.name,
                    "created_at": user.created_at.isoformat(),
                    "updated_at": user.updated_at.isoformat(),
                },
            },
        }

    except ValueError as e:
        error_msg = str(e)

        # Check if it's email already exists error
        if "already registered" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "success": False,
                    "error": {"code": "EMAIL_EXISTS", "message": "Email already registered"},
                },
            )

        # Validation error
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": error_msg},
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        # Log the actual error for debugging
        import traceback
        print(f"Signup error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {"code": "INTERNAL_ERROR", "message": f"Failed to create account: {str(e)}"},
            },
        )


@router.post("/signin", status_code=status.HTTP_200_OK)
async def signin(credentials: SigninRequest, db: Session = Depends(get_session)):
    """
    Authenticate user and return JWT token.

    Request Body:
        - email: User's email address
        - password: User's password

    Returns:
        200: {
            "success": true,
            "data": {
                "token": "eyJhbGci...",
                "user": {
                    "id": "uuid-string",
                    "email": "user@example.com",
                    "name": "John Doe",
                    "created_at": "2023-12-08T10:00:00Z",
                    "updated_at": "2023-12-08T10:00:00Z"
                }
            }
        }

    Raises:
        401: Invalid credentials
        500: Internal server error
    """
    try:
        # Authenticate user
        user = auth_service.authenticate_user(db=db, email=credentials.email, password=credentials.password)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "success": False,
                    "error": {
                        "code": "INVALID_CREDENTIALS",
                        "message": "Invalid email or password",
                    },
                },
            )

        # Generate JWT token
        token = generate_jwt_token(str(user.id), user.email)

        # Return success response with token and user data
        return {
            "success": True,
            "data": {
                "token": token,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "name": user.name,
                    "created_at": user.created_at.isoformat(),
                    "updated_at": user.updated_at.isoformat(),
                },
            },
        }

    except HTTPException:
        raise

    except Exception as e:
        # Log the actual error for debugging
        import traceback
        print(f"Signin error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {"code": "INTERNAL_ERROR", "message": f"Authentication failed: {str(e)}"},
            },
        )


@router.post("/signout", status_code=status.HTTP_200_OK)
async def signout(current_user: Dict[str, str] = Depends(verify_jwt_token)):
    """
    Sign out user (client-side token removal).

    Backend doesn't need to do anything for stateless JWT authentication.
    The client should remove the token from storage.

    Headers:
        Authorization: Bearer <token>

    Returns:
        200: {
            "success": true
        }

    Raises:
        401: Invalid or expired token
    """
    # For stateless JWT, signout is handled client-side by removing the token
    # We just verify the token is valid and return success
    return {"success": True}
