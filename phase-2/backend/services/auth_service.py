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
        # More strict pattern that rejects invalid formats
        pattern = r"^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$"
        # Additional checks for common invalid patterns
        if not email or "@" not in email:
            return False
        if email.startswith(".") or email.startswith("@") or email.endswith(".") or email.endswith("@"):
            return False
        if ".." in email or "@@" in email or " " in email:
            return False
        if email.count("@") != 1:
            return False
        parts = email.split("@")
        if len(parts) != 2 or not parts[0] or not parts[1]:
            return False
        if "." not in parts[1] or parts[1].startswith(".") or parts[1].endswith("."):
            return False
        return bool(re.match(pattern, email))

    def reset_password(self, db: Session, email: str, new_password: str) -> User:
        """
        Reset user password by email.

        Args:
            db: Database session
            email: User's email address
            new_password: New plain text password

        Returns:
            User: Updated user object

        Raises:
            ValueError: If user not found or validation fails
        """
        # Find user by email
        user = self.get_user_by_email(db, email)

        if not user:
            raise ValueError("User not found with this email")

        # Validate password strength
        if not self._validate_password_strength(new_password):
            raise ValueError("Password must be at least 8 characters long")

        # Hash new password
        password_hash = hash_password(new_password)

        # Update user password
        user.password_hash = password_hash
        db.add(user)
        db.commit()
        db.refresh(user)

        return user

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
