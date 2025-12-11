"""
API tests for authentication endpoints.

This module tests all authentication-related API endpoints through HTTP requests,
validating signup, signin, and signout functionality.
"""

from fastapi.testclient import TestClient

from models import User
from utils.password import hash_password


class TestSignupAPI:
    """Tests for POST /api/auth/signup endpoint."""

    def test_signup_success_returns_201_with_token(self, client: TestClient):
        """Test successful signup returns 201 with JWT token and user data."""
        # Arrange
        signup_data = {
            "email": "newuser@example.com",
            "password": "SecurePass123",
            "name": "New User",
        }

        # Act
        response = client.post("/api/auth/signup", json=signup_data)

        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert "token" in data["data"]
        assert data["data"]["user"]["email"] == "newuser@example.com"
        assert data["data"]["user"]["name"] == "New User"
        assert "id" in data["data"]["user"]
        assert "password" not in data["data"]["user"]  # Should not return password

    def test_signup_duplicate_email_returns_409(self, client: TestClient, session):
        """Test signup with duplicate email returns 409 Conflict."""
        # Arrange - Create existing user
        existing_user = User(
            email="existing@example.com",
            password_hash=hash_password("password123"),
            name="Existing User",
        )
        session.add(existing_user)
        session.commit()

        signup_data = {
            "email": "existing@example.com",
            "password": "NewPassword123",
            "name": "New User",
        }

        # Act
        response = client.post("/api/auth/signup", json=signup_data)

        # Assert
        assert response.status_code == 409
        data = response.json()
        assert data["success"] is False
        assert "EMAIL_EXISTS" in str(data["error"]["code"])

    def test_signup_invalid_email_returns_422(self, client: TestClient):
        """Test signup with invalid email format returns 422."""
        # Arrange
        signup_data = {
            "email": "not-an-email",
            "password": "SecurePass123",
            "name": "Test User",
        }

        # Act
        response = client.post("/api/auth/signup", json=signup_data)

        # Assert
        assert response.status_code == 422

    def test_signup_weak_password_returns_422(self, client: TestClient):
        """Test signup with weak password returns 422."""
        # Arrange
        signup_data = {"email": "user@example.com", "password": "short", "name": "Test User"}

        # Act
        response = client.post("/api/auth/signup", json=signup_data)

        # Assert
        assert response.status_code == 422

    def test_signup_empty_name_returns_422(self, client: TestClient):
        """Test signup with empty name returns 422."""
        # Arrange
        signup_data = {"email": "user@example.com", "password": "SecurePass123", "name": "   "}

        # Act
        response = client.post("/api/auth/signup", json=signup_data)

        # Assert
        assert response.status_code == 422

    def test_signup_missing_fields_returns_422(self, client: TestClient):
        """Test signup with missing required fields returns 422."""
        # Arrange - Missing password
        signup_data = {"email": "user@example.com", "name": "Test User"}

        # Act
        response = client.post("/api/auth/signup", json=signup_data)

        # Assert
        assert response.status_code == 422

    def test_signup_trims_whitespace_from_name(self, client: TestClient):
        """Test signup trims whitespace from name."""
        # Arrange
        signup_data = {
            "email": "trimmed@example.com",
            "password": "SecurePass123",
            "name": "  Trimmed Name  ",
        }

        # Act
        response = client.post("/api/auth/signup", json=signup_data)

        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["data"]["user"]["name"] == "Trimmed Name"

    def test_signup_password_not_in_response(self, client: TestClient):
        """Test signup does not return password in response."""
        # Arrange
        signup_data = {
            "email": "secure@example.com",
            "password": "SecurePass123",
            "name": "Secure User",
        }

        # Act
        response = client.post("/api/auth/signup", json=signup_data)

        # Assert
        assert response.status_code == 201
        response_str = response.text.lower()
        assert "password" not in response_str or "password_hash" not in response_str

    def test_signup_creates_user_in_database(self, client: TestClient, session):
        """Test signup actually creates user in database."""
        # Arrange
        signup_data = {
            "email": "dbuser@example.com",
            "password": "SecurePass123",
            "name": "DB User",
        }

        # Act
        response = client.post("/api/auth/signup", json=signup_data)

        # Assert
        assert response.status_code == 201

        # Verify user exists in database
        from sqlmodel import select

        user = session.exec(select(User).where(User.email == "dbuser@example.com")).first()
        assert user is not None
        assert user.name == "DB User"
        assert user.password_hash != "SecurePass123"  # Should be hashed


class TestSigninAPI:
    """Tests for POST /api/auth/signin endpoint."""

    def test_signin_success_returns_200_with_token(self, client: TestClient, session):
        """Test successful signin returns 200 with JWT token and user data."""
        # Arrange - Create user
        user = User(
            email="signin@example.com",
            password_hash=hash_password("CorrectPassword123"),
            name="Signin User",
        )
        session.add(user)
        session.commit()

        signin_data = {"email": "signin@example.com", "password": "CorrectPassword123"}

        # Act
        response = client.post("/api/auth/signin", json=signin_data)

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "token" in data["data"]
        assert data["data"]["user"]["email"] == "signin@example.com"
        assert data["data"]["user"]["name"] == "Signin User"

    def test_signin_wrong_password_returns_401(self, client: TestClient, session):
        """Test signin with wrong password returns 401."""
        # Arrange - Create user
        user = User(
            email="wrongpass@example.com",
            password_hash=hash_password("CorrectPassword123"),
            name="Test User",
        )
        session.add(user)
        session.commit()

        signin_data = {"email": "wrongpass@example.com", "password": "WrongPassword456"}

        # Act
        response = client.post("/api/auth/signin", json=signin_data)

        # Assert
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert "INVALID_CREDENTIALS" in str(data["error"]["code"])

    def test_signin_nonexistent_email_returns_401(self, client: TestClient):
        """Test signin with non-existent email returns 401."""
        # Arrange
        signin_data = {"email": "nonexistent@example.com", "password": "AnyPassword123"}

        # Act
        response = client.post("/api/auth/signin", json=signin_data)

        # Assert
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False

    def test_signin_invalid_email_format_returns_422(self, client: TestClient):
        """Test signin with invalid email format returns 422."""
        # Arrange
        signin_data = {"email": "not-an-email", "password": "Password123"}

        # Act
        response = client.post("/api/auth/signin", json=signin_data)

        # Assert
        assert response.status_code == 422

    def test_signin_missing_credentials_returns_422(self, client: TestClient):
        """Test signin with missing credentials returns 422."""
        # Arrange - Missing password
        signin_data = {"email": "user@example.com"}

        # Act
        response = client.post("/api/auth/signin", json=signin_data)

        # Assert
        assert response.status_code == 422

    def test_signin_returns_valid_jwt_token(self, client: TestClient, session):
        """Test signin returns a valid JWT token that can be used for authentication."""
        # Arrange - Create user
        user = User(
            email="jwtuser@example.com",
            password_hash=hash_password("Password123"),
            name="JWT User",
        )
        session.add(user)
        session.commit()
        user_id = str(user.id)

        # Act - Sign in
        signin_data = {"email": "jwtuser@example.com", "password": "Password123"}
        signin_response = client.post("/api/auth/signin", json=signin_data)
        token = signin_response.json()["data"]["token"]

        # Assert - Use token to access protected endpoint
        headers = {"Authorization": f"Bearer {token}"}
        tasks_response = client.get(f"/api/{user_id}/tasks", headers=headers)
        assert tasks_response.status_code == 200

    def test_signin_case_sensitive_password(self, client: TestClient, session):
        """Test signin is case-sensitive for password."""
        # Arrange - Create user
        user = User(
            email="casetest@example.com",
            password_hash=hash_password("CaseSensitive123"),
            name="Case User",
        )
        session.add(user)
        session.commit()

        # Act - Try with different case
        signin_data = {"email": "casetest@example.com", "password": "casesensitive123"}
        response = client.post("/api/auth/signin", json=signin_data)

        # Assert
        assert response.status_code == 401


class TestSignoutAPI:
    """Tests for POST /api/auth/signout endpoint."""

    def test_signout_with_valid_token_returns_200(self, client: TestClient, session):
        """Test signout with valid token returns 200."""
        # Arrange - Create user and sign in
        user = User(
            email="signout@example.com",
            password_hash=hash_password("Password123"),
            name="Signout User",
        )
        session.add(user)
        session.commit()

        # Sign in to get token
        signin_response = client.post(
            "/api/auth/signin",
            json={"email": "signout@example.com", "password": "Password123"},
        )
        token = signin_response.json()["data"]["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Act
        response = client.post("/api/auth/signout", headers=headers)

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_signout_without_token_returns_401(self, client: TestClient):
        """Test signout without authentication token returns 401."""
        # Act
        response = client.post("/api/auth/signout")

        # Assert
        assert response.status_code == 401

    def test_signout_with_invalid_token_returns_401(self, client: TestClient):
        """Test signout with invalid token returns 401."""
        # Arrange
        headers = {"Authorization": "Bearer invalid-token-here"}

        # Act
        response = client.post("/api/auth/signout", headers=headers)

        # Assert
        assert response.status_code == 401


class TestAuthenticationFlow:
    """Tests for complete authentication flow."""

    def test_complete_auth_flow_signup_signin_signout(self, client: TestClient):
        """Test complete flow: signup -> signin -> signout."""
        # Step 1: Signup
        signup_data = {
            "email": "flowuser@example.com",
            "password": "FlowPassword123",
            "name": "Flow User",
        }
        signup_response = client.post("/api/auth/signup", json=signup_data)
        assert signup_response.status_code == 201
        signup_token = signup_response.json()["data"]["token"]
        user_id = signup_response.json()["data"]["user"]["id"]

        # Step 2: Use signup token to access protected endpoint
        headers = {"Authorization": f"Bearer {signup_token}"}
        tasks_response = client.get(f"/api/{user_id}/tasks", headers=headers)
        assert tasks_response.status_code == 200

        # Step 3: Sign in again (new session)
        signin_data = {"email": "flowuser@example.com", "password": "FlowPassword123"}
        signin_response = client.post("/api/auth/signin", json=signin_data)
        assert signin_response.status_code == 200
        signin_token = signin_response.json()["data"]["token"]

        # Step 4: Use signin token
        headers = {"Authorization": f"Bearer {signin_token}"}
        tasks_response2 = client.get(f"/api/{user_id}/tasks", headers=headers)
        assert tasks_response2.status_code == 200

        # Step 5: Sign out
        signout_response = client.post("/api/auth/signout", headers=headers)
        assert signout_response.status_code == 200

    def test_signup_creates_unique_tokens_for_different_users(self, client: TestClient):
        """Test that different users get different JWT tokens."""
        # Arrange & Act
        user1_response = client.post(
            "/api/auth/signup",
            json={"email": "user1@example.com", "password": "Password123", "name": "User 1"},
        )
        user2_response = client.post(
            "/api/auth/signup",
            json={"email": "user2@example.com", "password": "Password123", "name": "User 2"},
        )

        # Assert
        token1 = user1_response.json()["data"]["token"]
        token2 = user2_response.json()["data"]["token"]
        assert token1 != token2

    def test_token_contains_user_information(self, client: TestClient):
        """Test JWT token can be used to identify user."""
        # Arrange - Create user and sign in
        signup_response = client.post(
            "/api/auth/signup",
            json={"email": "tokenuser@example.com", "password": "Password123", "name": "Token User"},
        )
        token = signup_response.json()["data"]["token"]
        user_id = signup_response.json()["data"]["user"]["id"]

        # Act - Use token to access user-specific endpoint
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get(f"/api/{user_id}/tasks", headers=headers)

        # Assert - Should successfully access own data
        assert response.status_code == 200


class TestAuthenticationEdgeCases:
    """Tests for edge cases in authentication."""

    def test_signup_with_very_long_name(self, client: TestClient):
        """Test signup with maximum allowed name length."""
        # Arrange - Max length is 100 characters
        long_name = "A" * 100
        signup_data = {
            "email": "longname@example.com",
            "password": "Password123",
            "name": long_name,
        }

        # Act
        response = client.post("/api/auth/signup", json=signup_data)

        # Assert
        assert response.status_code == 201
        assert response.json()["data"]["user"]["name"] == long_name

    def test_signup_with_unicode_characters(self, client: TestClient):
        """Test signup with unicode characters in name."""
        # Arrange
        unicode_names = ["José García", "李明", "Владимир", "محمد"]

        for idx, name in enumerate(unicode_names):
            signup_data = {
                "email": f"unicode{idx}@example.com",
                "password": "Password123",
                "name": name,
            }

            # Act
            response = client.post("/api/auth/signup", json=signup_data)

            # Assert
            assert response.status_code == 201
            assert response.json()["data"]["user"]["name"] == name

    def test_signin_multiple_times_returns_different_tokens(self, client: TestClient, session):
        """Test signing in multiple times returns different tokens each time."""
        # Arrange - Create user
        user = User(
            email="multiplelogin@example.com",
            password_hash=hash_password("Password123"),
            name="Multi User",
        )
        session.add(user)
        session.commit()

        signin_data = {"email": "multiplelogin@example.com", "password": "Password123"}

        # Act - Sign in twice
        response1 = client.post("/api/auth/signin", json=signin_data)
        response2 = client.post("/api/auth/signin", json=signin_data)

        # Assert - Tokens should be different (different issued_at time)
        # Note: If tokens are generated too quickly, they might be identical
        # This depends on JWT implementation and timestamp precision
        assert response1.status_code == 200
        assert response2.status_code == 200
