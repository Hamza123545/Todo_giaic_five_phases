"""
Unit tests for AuthService.

This module tests all AuthService methods with mocked dependencies
to ensure authentication business logic functions correctly in isolation.
"""

import pytest
from sqlmodel import Session

from models import User
from services.auth_service import AuthService


class TestAuthServiceCreateUser:
    """Tests for AuthService.create_user method."""

    def test_create_user_success_returns_user_with_hashed_password(self, session: Session):
        """
        Test successful user creation returns user with hashed password.

        Arrange: Create valid user data
        Act: Call create_user
        Assert: User is created with hashed password, not plain text
        """
        # Arrange
        auth_service = AuthService()
        email = "test@example.com"
        password = "SecurePassword123"
        name = "Test User"

        # Act
        user = auth_service.create_user(session, email, password, name)

        # Assert
        assert user.id is not None
        assert user.email == email
        assert user.name == name
        assert user.password_hash != password  # Password should be hashed
        assert len(user.password_hash) > len(password)  # Hashed password is longer
        assert user.created_at is not None
        assert user.updated_at is not None

    def test_create_user_duplicate_email_raises_value_error(self, session: Session):
        """Test creating user with duplicate email raises ValueError."""
        # Arrange
        auth_service = AuthService()
        email = "duplicate@example.com"

        # Create first user
        auth_service.create_user(session, email, "password123", "First User")

        # Act & Assert - Try to create second user with same email
        with pytest.raises(ValueError, match="Email already registered"):
            auth_service.create_user(session, email, "password456", "Second User")

    def test_create_user_invalid_email_format_raises_value_error(self, session: Session):
        """Test creating user with invalid email format raises ValueError."""
        # Arrange
        auth_service = AuthService()

        # Act & Assert - Invalid email formats
        invalid_emails = [
            "notanemail",
            "@nodomain.com",
            "missing@domain",
            "spaces in@email.com",
            "double@@email.com",
        ]

        for invalid_email in invalid_emails:
            with pytest.raises(ValueError, match="Invalid email format"):
                auth_service.create_user(session, invalid_email, "password123", "Test User")

    def test_create_user_weak_password_raises_value_error(self, session: Session):
        """Test creating user with weak password raises ValueError."""
        # Arrange
        auth_service = AuthService()

        # Act & Assert - Passwords less than 8 characters
        weak_passwords = ["short", "1234567", "abc"]

        for weak_password in weak_passwords:
            with pytest.raises(ValueError, match="Password must be at least 8 characters"):
                auth_service.create_user(session, "test@example.com", weak_password, "Test User")

    def test_create_user_empty_name_raises_value_error(self, session: Session):
        """Test creating user with empty name raises ValueError."""
        # Arrange
        auth_service = AuthService()

        # Act & Assert - Empty and whitespace names
        invalid_names = ["", "   ", "\t", "\n"]

        for invalid_name in invalid_names:
            with pytest.raises(ValueError, match="Name cannot be empty"):
                auth_service.create_user(session, "test@example.com", "password123", invalid_name)

    def test_create_user_trims_whitespace_from_name(self, session: Session):
        """Test creating user trims whitespace from name."""
        # Arrange
        auth_service = AuthService()

        # Act
        user = auth_service.create_user(
            session, "test@example.com", "password123", "  Trimmed Name  "
        )

        # Assert
        assert user.name == "Trimmed Name"

    def test_create_user_persists_to_database(self, session: Session):
        """Test created user is persisted to database."""
        # Arrange
        auth_service = AuthService()
        email = "persisted@example.com"

        # Act
        user = auth_service.create_user(session, email, "password123", "Persisted User")
        session.commit()

        # Assert - Fetch from database to verify persistence
        from sqlmodel import select

        statement = select(User).where(User.email == email)
        persisted_user = session.exec(statement).first()
        assert persisted_user is not None
        assert persisted_user.id == user.id
        assert persisted_user.email == email


class TestAuthServiceAuthenticateUser:
    """Tests for AuthService.authenticate_user method."""

    def test_authenticate_user_success_returns_user(self, session: Session):
        """Test successful authentication returns user object."""
        # Arrange
        auth_service = AuthService()
        email = "auth@example.com"
        password = "CorrectPassword123"

        # Create user
        created_user = auth_service.create_user(session, email, password, "Auth User")

        # Act
        authenticated_user = auth_service.authenticate_user(session, email, password)

        # Assert
        assert authenticated_user is not None
        assert authenticated_user.id == created_user.id
        assert authenticated_user.email == email

    def test_authenticate_user_wrong_password_returns_none(self, session: Session):
        """Test authentication with wrong password returns None."""
        # Arrange
        auth_service = AuthService()
        email = "auth@example.com"
        correct_password = "CorrectPassword123"
        wrong_password = "WrongPassword456"

        # Create user
        auth_service.create_user(session, email, correct_password, "Auth User")

        # Act
        result = auth_service.authenticate_user(session, email, wrong_password)

        # Assert
        assert result is None

    def test_authenticate_user_nonexistent_email_returns_none(self, session: Session):
        """Test authentication with non-existent email returns None."""
        # Arrange
        auth_service = AuthService()

        # Act
        result = auth_service.authenticate_user(
            session, "nonexistent@example.com", "password123"
        )

        # Assert
        assert result is None

    def test_authenticate_user_case_sensitive_email(self, session: Session):
        """Test authentication is case-sensitive for email."""
        # Arrange
        auth_service = AuthService()
        email = "CaseSensitive@example.com"
        password = "Password123"

        # Create user with specific case
        auth_service.create_user(session, email, password, "Case User")

        # Act - Try with different case
        result = auth_service.authenticate_user(session, "casesensitive@example.com", password)

        # Assert - Should not authenticate (case mismatch)
        # Note: This depends on database collation settings
        # If database is case-insensitive, this test might fail
        # In that case, authentication would succeed
        assert result is None


class TestAuthServiceGetUserByEmail:
    """Tests for AuthService.get_user_by_email method."""

    def test_get_user_by_email_existing_user_returns_user(self, session: Session):
        """Test getting existing user by email returns user."""
        # Arrange
        auth_service = AuthService()
        email = "find@example.com"

        created_user = auth_service.create_user(session, email, "password123", "Find User")

        # Act
        found_user = auth_service.get_user_by_email(session, email)

        # Assert
        assert found_user is not None
        assert found_user.id == created_user.id
        assert found_user.email == email

    def test_get_user_by_email_nonexistent_returns_none(self, session: Session):
        """Test getting non-existent user returns None."""
        # Arrange
        auth_service = AuthService()

        # Act
        result = auth_service.get_user_by_email(session, "nonexistent@example.com")

        # Assert
        assert result is None


class TestAuthServiceValidation:
    """Tests for AuthService validation helper methods."""

    def test_validate_email_valid_formats_return_true(self):
        """Test email validation accepts valid email formats."""
        # Arrange
        auth_service = AuthService()

        valid_emails = [
            "simple@example.com",
            "user.name@example.com",
            "user+tag@example.co.uk",
            "user_123@test-domain.com",
            "a@b.co",
        ]

        # Act & Assert
        for email in valid_emails:
            assert auth_service._validate_email(email) is True

    def test_validate_email_invalid_formats_return_false(self):
        """Test email validation rejects invalid email formats."""
        # Arrange
        auth_service = AuthService()

        invalid_emails = [
            "notanemail",
            "@nodomain.com",
            "missing@domain",
            "double@@email.com",
            "spaces in@email.com",
            "missing.domain@",
            ".startdot@example.com",
            "enddot.@example.com",
        ]

        # Act & Assert
        for email in invalid_emails:
            assert auth_service._validate_email(email) is False

    def test_validate_password_strength_minimum_length_required(self):
        """Test password validation enforces minimum length."""
        # Arrange
        auth_service = AuthService()

        # Act & Assert
        assert auth_service._validate_password_strength("1234567") is False  # 7 chars
        assert auth_service._validate_password_strength("12345678") is True  # 8 chars
        assert auth_service._validate_password_strength("123456789") is True  # 9 chars

    def test_validate_password_strength_accepts_various_characters(self):
        """Test password validation accepts various character types."""
        # Arrange
        auth_service = AuthService()

        valid_passwords = [
            "12345678",  # Numbers only
            "abcdefgh",  # Letters only
            "Ab123456",  # Mixed
            "Pass@word1",  # Special characters
            "longer_password_with_many_chars",  # Long password
        ]

        # Act & Assert
        for password in valid_passwords:
            assert auth_service._validate_password_strength(password) is True


class TestAuthServiceEdgeCases:
    """Tests for edge cases and boundary conditions."""

    def test_create_user_maximum_name_length(self, session: Session):
        """Test creating user with maximum allowed name length."""
        # Arrange
        auth_service = AuthService()
        # Name field has max_length=100 in model
        long_name = "A" * 100

        # Act
        user = auth_service.create_user(
            session, "longname@example.com", "password123", long_name
        )

        # Assert
        assert user.name == long_name
        assert len(user.name) == 100

    def test_create_user_unicode_characters_in_name(self, session: Session):
        """Test creating user with unicode characters in name."""
        # Arrange
        auth_service = AuthService()
        unicode_names = ["José García", "李明", "Владимир", "محمد"]

        # Act & Assert
        for idx, name in enumerate(unicode_names):
            user = auth_service.create_user(
                session, f"unicode{idx}@example.com", "password123", name
            )
            assert user.name == name

    def test_authenticate_user_multiple_failed_attempts(self, session: Session):
        """Test multiple failed authentication attempts."""
        # Arrange
        auth_service = AuthService()
        email = "locked@example.com"
        password = "CorrectPassword123"

        auth_service.create_user(session, email, password, "Locked User")

        # Act - Multiple failed attempts
        for _ in range(5):
            result = auth_service.authenticate_user(session, email, "WrongPassword")
            assert result is None

        # Assert - Correct password should still work (no lockout implemented)
        result = auth_service.authenticate_user(session, email, password)
        assert result is not None
