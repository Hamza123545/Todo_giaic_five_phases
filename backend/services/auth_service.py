"""
Authentication service for user management and authentication.

This module provides business logic for user signup, signin, and validation.
"""

import re
from typing import Optional

from sqlmodel import Session, select

from models import User
from utils.password import hash_password, verify_password


class AuthService:
    """Service for authentication-related business logic."""

    def create_user(self, db: Session, email: str, password: str, name: str) -> User:
        """
        Create new user account.

        Args:
            db: Database session
            email: User's email address
            password: Plain text password
            name: User's display name

        Returns:
            User: Created user object

        Raises:
            ValueError: If email already exists or validation fails
        """
        # Check if email already exists
        existing_user = db.exec(select(User).where(User.email == email)).first()

        if existing_user:
            raise ValueError("Email already registered")

        # Validate email format (additional validation)
        if not self._validate_email(email):
            raise ValueError("Invalid email format")

        # Validate password strength
        if not self._validate_password_strength(password):
            raise ValueError("Password must be at least 8 characters long")

        # Validate name
        if not name.strip():
            raise ValueError("Name cannot be empty")

        # Hash password
        password_hash = hash_password(password)

        # Create user
        user = User(email=email, password_hash=password_hash, name=name.strip())

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        """
        Authenticate user with email and password.

        Args:
            db: Database session
            email: User's email address
            password: Plain text password

        Returns:
            User if authentication successful, None otherwise
        """
        # Find user by email
        user = db.exec(select(User).where(User.email == email)).first()

        if not user:
            return None

        # Verify password
        if not verify_password(password, user.password_hash):
            return None

        return user

    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        """
        Get user by email address.

        Args:
            db: Database session
            email: User's email address

        Returns:
            User if found, None otherwise
        """
        return db.exec(select(User).where(User.email == email)).first()

    def _validate_email(self, email: str) -> bool:
        """
        Validate email format.

        Args:
            email: Email address to validate

        Returns:
            bool: True if valid, False otherwise
        """
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return bool(re.match(pattern, email))

    def _validate_password_strength(self, password: str) -> bool:
        """
        Validate password strength.

        Args:
            password: Password to validate

        Returns:
            bool: True if valid, False otherwise
        """
        if len(password) < 8:
            return False
        return True
