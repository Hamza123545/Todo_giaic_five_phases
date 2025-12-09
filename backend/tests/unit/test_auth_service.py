"""
Unit tests for auth_service.py.

This module tests authentication service business logic with mocked dependencies.
"""

import pytest
from unittest.mock import Mock, patch
from uuid import uuid4

from sqlmodel import Session
from services.auth_service import AuthService
from models import User


@pytest.mark.unit
class TestAuthService:
    """Test suite for AuthService class."""

    def test_create_user_success_returns_user_with_hashed_password(self, session: Session):
        """Test successful user creation returns user with hashed password."""
        # Arrange
        auth_service = AuthService()
        email = "newuser@example.com"
        password = "validpassword123"
        name = "New User"

        # Act
        user = auth_service.create_user(session, email, password, name)

        # Assert
        assert user is not None
        assert user.email == email
        assert user.name == name
        assert user.password_hash is not None
        assert user.password_hash != password  # Password should be hashed
        assert len(user.password_hash) > 0

    def test_create_user_duplicate_email_raises_value_error(self, session: Session):
        """Test creating user with duplicate email raises ValueError."""
        # Arrange
        auth_service = AuthService()
        email = "duplicate@example.com"
        password = "password123"
        name = "First User"

        # Create first user
        auth_service.create_user(session, email, password, name)

        # Act & Assert
        with pytest.raises(ValueError, match="Email already registered"):
            auth_service.create_user(session, email, password, "Second User")

    def test_create_user_invalid_email_raises_value_error(self, session: Session):
        """Test creating user with invalid email raises ValueError."""
        # Arrange
        auth_service = AuthService()
        invalid_emails = [
            "notanemail",
            "@example.com",
            "user@",
            "user @example.com",
            "user@.com",
            "",
        ]

        # Act & Assert
        for invalid_email in invalid_emails:
            with pytest.raises(ValueError, match="Invalid email format"):
                auth_service.create_user(session, invalid_email, "password123", "Test User")

    def test_create_user_weak_password_raises_value_error(self, session: Session):
        """Test creating user with weak password raises ValueError."""
        # Arrange
        auth_service = AuthService()
        email = "user@example.com"
        weak_passwords = ["short", "1234567", "", "       "]

        # Act & Assert
        for weak_password in weak_passwords:
            with pytest.raises(ValueError, match="Password must be at least 8 characters"):
                auth_service.create_user(session, email, weak_password, "Test User")

    def test_create_user_empty_name_raises_value_error(self, session: Session):
        """Test creating user with empty name raises ValueError."""
        # Arrange
        auth_service = AuthService()
        email = "user@example.com"
        password = "password123"
        empty_names = ["", "   ", "\t", "\n"]

        # Act & Assert
        for empty_name in empty_names:
            with pytest.raises(ValueError, match="Name cannot be empty"):
                auth_service.create_user(session, email, password, empty_name)

    def test_authenticate_user_success_returns_user(self, session: Session):
        """Test successful authentication returns user object."""
        # Arrange
        auth_service = AuthService()
        email = "auth@example.com"
        password = "password123"
        name = "Auth User"

        # Create user
        created_user = auth_service.create_user(session, email, password, name)

        # Act
        authenticated_user = auth_service.authenticate_user(session, email, password)

        # Assert
        assert authenticated_user is not None
        assert authenticated_user.id == created_user.id
        assert authenticated_user.email == email
        assert authenticated_user.name == name

    def test_authenticate_user_invalid_password_returns_none(self, session: Session):
        """Test authentication with invalid password returns None."""
        # Arrange
        auth_service = AuthService()
        email = "auth@example.com"
        password = "password123"
        name = "Auth User"

        # Create user
        auth_service.create_user(session, email, password, name)

        # Act
        authenticated_user = auth_service.authenticate_user(session, email, "wrongpassword")

        # Assert
        assert authenticated_user is None

    def test_authenticate_user_nonexistent_email_returns_none(self, session: Session):
        """Test authentication with nonexistent email returns None."""
        # Arrange
        auth_service = AuthService()
        email = "nonexistent@example.com"
        password = "password123"

        # Act
        authenticated_user = auth_service.authenticate_user(session, email, password)

        # Assert
        assert authenticated_user is None

    def test_password_hashing_verification_works_correctly(self, session: Session):
        """Test that password hashing and verification work correctly."""
        # Arrange
        auth_service = AuthService()
        email = "hash@example.com"
        password = "testpassword123"
        name = "Hash User"

        # Act
        user = auth_service.create_user(session, email, password, name)

        # Assert - Password should be hashed and verifiable
        from utils.password import verify_password
        assert verify_password(password, user.password_hash)
        assert not verify_password("wrongpassword", user.password_hash)

    def test_email_validation_accepts_valid_emails(self):
        """Test that email validation accepts valid email formats."""
        # Arrange
        auth_service = AuthService()
        valid_emails = [
            "user@example.com",
            "test.user@example.com",
            "user+tag@example.co.uk",
            "user123@test-domain.com",
            "first.last@subdomain.example.com",
        ]

        # Act & Assert
        for valid_email in valid_emails:
            assert auth_service._validate_email(valid_email) is True

    def test_email_validation_rejects_invalid_emails(self):
        """Test that email validation rejects invalid email formats."""
        # Arrange
        auth_service = AuthService()
        invalid_emails = [
            "notanemail",
            "@example.com",
            "user@",
            "user @example.com",
            "user@.com",
            "",
            "user..name@example.com",
        ]

        # Act & Assert
        for invalid_email in invalid_emails:
            assert auth_service._validate_email(invalid_email) is False

    def test_password_strength_validation_accepts_strong_passwords(self):
        """Test that password strength validation accepts strong passwords."""
        # Arrange
        auth_service = AuthService()
        strong_passwords = [
            "password123",
            "12345678",
            "VeryLongPasswordWithManyCharacters",
            "Pass@123",
            "p@ssw0rd!",
        ]

        # Act & Assert
        for strong_password in strong_passwords:
            assert auth_service._validate_password_strength(strong_password) is True

    def test_password_strength_validation_rejects_weak_passwords(self):
        """Test that password strength validation rejects weak passwords."""
        # Arrange
        auth_service = AuthService()
        weak_passwords = [
            "short",
            "1234567",
            "",
            "       ",
            "pass",
        ]

        # Act & Assert
        for weak_password in weak_passwords:
            assert auth_service._validate_password_strength(weak_password) is False

    def test_get_user_by_email_success_returns_user(self, session: Session):
        """Test getting user by email returns correct user."""
        # Arrange
        auth_service = AuthService()
        email = "find@example.com"
        password = "password123"
        name = "Find User"

        # Create user
        created_user = auth_service.create_user(session, email, password, name)

        # Act
        found_user = auth_service.get_user_by_email(session, email)

        # Assert
        assert found_user is not None
        assert found_user.id == created_user.id
        assert found_user.email == email

    def test_get_user_by_email_nonexistent_returns_none(self, session: Session):
        """Test getting nonexistent user by email returns None."""
        # Arrange
        auth_service = AuthService()
        email = "nonexistent@example.com"

        # Act
        found_user = auth_service.get_user_by_email(session, email)

        # Assert
        assert found_user is None
