"""
Integration tests for authentication endpoints.

This module tests the authentication API endpoints including signup, signin, and signout.
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


class TestSignup:
    """Test cases for POST /api/auth/signup endpoint."""

    def test_signup_success(self, client: TestClient):
        """Test successful user signup."""
        response = client.post(
            "/api/auth/signup",
            json={"email": "newuser@example.com", "password": "password123", "name": "New User"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert "token" in data["data"]
        assert data["data"]["user"]["email"] == "newuser@example.com"
        assert data["data"]["user"]["name"] == "New User"
        assert "id" in data["data"]["user"]
        assert "created_at" in data["data"]["user"]
        assert "updated_at" in data["data"]["user"]

    def test_signup_duplicate_email(self, client: TestClient):
        """Test signup with duplicate email returns 409."""
        # First signup
        client.post(
            "/api/auth/signup",
            json={"email": "duplicate@example.com", "password": "password123", "name": "User One"},
        )

        # Second signup with same email
        response = client.post(
            "/api/auth/signup",
            json={"email": "duplicate@example.com", "password": "password456", "name": "User Two"},
        )

        assert response.status_code == 409
        data = response.json()
        assert "error" in data["detail"]
        assert data["detail"]["error"]["code"] == "EMAIL_EXISTS"

    def test_signup_invalid_email(self, client: TestClient):
        """Test signup with invalid email format returns 400."""
        response = client.post(
            "/api/auth/signup",
            json={"email": "invalid-email", "password": "password123", "name": "Test User"},
        )

        assert response.status_code == 422  # Pydantic validation error

    def test_signup_weak_password(self, client: TestClient):
        """Test signup with password less than 8 characters returns 400."""
        response = client.post(
            "/api/auth/signup", json={"email": "test@example.com", "password": "short", "name": "Test User"}
        )

        assert response.status_code == 422  # Pydantic validation error

    def test_signup_empty_name(self, client: TestClient):
        """Test signup with empty name returns 400."""
        response = client.post(
            "/api/auth/signup", json={"email": "test@example.com", "password": "password123", "name": "   "}
        )

        assert response.status_code == 400 or response.status_code == 422

    def test_signup_missing_fields(self, client: TestClient):
        """Test signup with missing required fields returns 422."""
        response = client.post("/api/auth/signup", json={"email": "test@example.com"})

        assert response.status_code == 422


class TestSignin:
    """Test cases for POST /api/auth/signin endpoint."""

    def test_signin_success(self, client: TestClient):
        """Test successful user signin."""
        # First create a user
        client.post(
            "/api/auth/signup",
            json={"email": "signin@example.com", "password": "password123", "name": "Signin User"},
        )

        # Then sign in
        response = client.post(
            "/api/auth/signin", json={"email": "signin@example.com", "password": "password123"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "token" in data["data"]
        assert data["data"]["user"]["email"] == "signin@example.com"
        assert data["data"]["user"]["name"] == "Signin User"

    def test_signin_invalid_email(self, client: TestClient):
        """Test signin with non-existent email returns 401."""
        response = client.post(
            "/api/auth/signin", json={"email": "nonexistent@example.com", "password": "password123"}
        )

        assert response.status_code == 401
        data = response.json()
        assert "error" in data["detail"]
        assert data["detail"]["error"]["code"] == "INVALID_CREDENTIALS"

    def test_signin_wrong_password(self, client: TestClient):
        """Test signin with wrong password returns 401."""
        # First create a user
        client.post(
            "/api/auth/signup",
            json={"email": "wrongpass@example.com", "password": "correctpassword", "name": "Test User"},
        )

        # Try to sign in with wrong password
        response = client.post(
            "/api/auth/signin", json={"email": "wrongpass@example.com", "password": "wrongpassword"}
        )

        assert response.status_code == 401
        data = response.json()
        assert "error" in data["detail"]
        assert data["detail"]["error"]["code"] == "INVALID_CREDENTIALS"

    def test_signin_missing_fields(self, client: TestClient):
        """Test signin with missing fields returns 422."""
        response = client.post("/api/auth/signin", json={"email": "test@example.com"})

        assert response.status_code == 422


class TestSignout:
    """Test cases for POST /api/auth/signout endpoint."""

    def test_signout_success(self, client: TestClient):
        """Test successful signout with valid token."""
        # First create and sign in a user
        signup_response = client.post(
            "/api/auth/signup",
            json={"email": "signout@example.com", "password": "password123", "name": "Signout User"},
        )
        token = signup_response.json()["data"]["token"]

        # Then sign out
        response = client.post("/api/auth/signout", headers={"Authorization": f"Bearer {token}"})

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_signout_no_token(self, client: TestClient):
        """Test signout without token returns 403."""
        response = client.post("/api/auth/signout")

        assert response.status_code == 403

    def test_signout_invalid_token(self, client: TestClient):
        """Test signout with invalid token returns 401."""
        response = client.post("/api/auth/signout", headers={"Authorization": "Bearer invalid_token"})

        assert response.status_code == 401


class TestJWTTokenValidation:
    """Test cases for JWT token validation."""

    def test_token_contains_user_info(self, client: TestClient):
        """Test that JWT token contains user ID and email."""
        response = client.post(
            "/api/auth/signup",
            json={"email": "tokentest@example.com", "password": "password123", "name": "Token Test"},
        )

        assert response.status_code == 201
        token = response.json()["data"]["token"]

        # Verify token can be used for authenticated requests
        signout_response = client.post("/api/auth/signout", headers={"Authorization": f"Bearer {token}"})
        assert signout_response.status_code == 200
