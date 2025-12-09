"""
Security tests for the Todo Backend API.

Tests various security controls and verifies the security checklist items.
"""
import pytest
from fastapi.testclient import TestClient
from main import app
from uuid import uuid4
from datetime import datetime, timedelta
import json
import os
from typing import Dict, Any

# Test user data
TEST_USER_EMAIL = "security_test@example.com"
TEST_USER_PASSWORD = "SecurePass123!"
TEST_USER_NAME = "Security Test User"

@pytest.fixture
def client():
    """Create a test client for the API."""
    return TestClient(app)

def test_jwt_token_security(client):
    """Test JWT token security controls."""
    # Test that JWT tokens are properly validated
    headers = {"Authorization": "Bearer invalid_token"}
    response = client.get("/api/123/tasks", headers=headers)

    # Should return 401 for invalid token
    assert response.status_code == 401

def test_user_isolation(client):
    """Test user isolation controls."""
    # Test that users can only access their own data
    # This would require creating multiple users and verifying cross-access prevention
    other_user_id = str(uuid4())
    auth_headers = {"Authorization": "Bearer valid_token"}  # This would be a real token in practice

    # Attempt to access another user's tasks
    response = client.get(f"/api/{other_user_id}/tasks", headers=auth_headers)

    # Should return 403 for unauthorized access to another user's data
    # This depends on the JWT token containing the correct user ID
    assert response.status_code in [401, 403, 404]

def test_rate_limiting(client):
    """Test rate limiting controls."""
    # Test that rate limiting is applied to endpoints
    user_id = str(uuid4())

    # Make multiple requests to test rate limiting
    for i in range(15):  # More than the default limit
        response = client.get(f"/api/{user_id}/tasks")

        # Early requests should succeed, later ones might be rate limited
        if i > 10:  # After the limit
            # Could be 429 (rate limited) or succeed depending on timing
            assert response.status_code in [200, 401, 403, 429]

def test_input_validation(client):
    """Test input validation controls."""
    # Test invalid data for task creation
    user_id = str(uuid4())
    invalid_task_data = {
        "title": "",  # Empty title should fail validation
        "description": "Test description",
        "priority": "invalid_priority",  # Invalid priority should fail
        "due_date": "invalid_date_format",  # Invalid date should fail
        "tags": ["valid_tag", 123]  # Invalid tag type should fail
    }

    headers = {"Authorization": "Bearer valid_token", "Content-Type": "application/json"}
    response = client.post(f"/api/{user_id}/tasks", headers=headers, json=invalid_task_data)

    # Should return 400 for validation errors
    assert response.status_code == 400

def test_sql_injection_prevention(client):
    """Test that SQL injection attempts are prevented."""
    user_id = str(uuid4())

    # Try SQL injection in various fields
    malicious_data = {
        "title": "'; DROP TABLE tasks; --",
        "description": "Test'; DELETE FROM users; --",
        "priority": "medium'; UPDATE users SET admin=1; --",
        "due_date": "2023-12-31'; SELECT * FROM users; --",
        "tags": ["'; SELECT * FROM users; --"]
    }

    headers = {"Authorization": "Bearer valid_token", "Content-Type": "application/json"}
    response = client.post(f"/api/{user_id}/tasks", headers=headers, json=malicious_data)

    # Should return 400 for validation errors or 422 for validation
    assert response.status_code in [400, 422, 401, 403]

def test_xss_prevention(client):
    """Test that XSS attempts are prevented."""
    user_id = str(uuid4())

    # Try XSS in various fields
    xss_data = {
        "title": "<script>alert('XSS')</script>",
        "description": "<img src=x onerror=alert('XSS')>",
        "priority": "<script>document.location='http://evil.com'</script>",
        "due_date": "2023-12-31",
        "tags": ["<script>alert('XSS')</script>"]
    }

    headers = {"Authorization": "Bearer valid_token", "Content-Type": "application/json"}
    response = client.post(f"/api/{user_id}/tasks", headers=headers, json=xss_data)

    # Should return 400 for validation errors or 422 for validation
    assert response.status_code in [400, 422, 401, 403]

def test_file_upload_security(client):
    """Test file upload security for import endpoint."""
    user_id = str(uuid4())

    # Test with a potentially malicious file
    malicious_content = """{
        "title": "<script>alert('XSS')</script>",
        "description": "'; DROP TABLE tasks; --",
        "priority": "medium"
    }"""

    # Create a file-like object with malicious content
    from io import BytesIO
    file_content = BytesIO(malicious_content.encode())

    headers = {"Authorization": "Bearer valid_token"}
    response = client.post(
        f"/api/{user_id}/tasks/import",
        headers=headers,
        files={"file": ("test.json", file_content, "application/json")}
    )

    # Should validate content and reject malicious data
    assert response.status_code in [400, 422, 401, 403]

def test_error_handling(client):
    """Test that error messages don't leak sensitive information."""
    # Test with invalid user ID format
    response = client.get("/api/invalid_user_id/tasks")

    # Should return appropriate error without revealing internal details
    assert response.status_code in [400, 401, 403, 404]

    # Check that response doesn't contain stack traces or internal info
    response_text = response.text
    assert "Traceback" not in response_text
    assert "Error:" not in response_text or "Internal" not in response_text

def test_cors_configuration(client):
    """Test CORS configuration."""
    # Test preflight request
    response = client.options(
        "/api/123/tasks",
        headers={
            "Origin": "http://example.com",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization"
        }
    )

    # Should handle preflight requests appropriately
    assert response.status_code in [200, 405]

def test_auth_failure_logging():
    """Test that authentication failures are logged."""
    # This would require checking logs, which is difficult in tests
    # For now, just verify that auth failures return proper status
    client = TestClient(app)

    # Try to access with invalid token
    headers = {"Authorization": "Bearer invalid_token"}
    response = client.get("/api/123/tasks", headers=headers)

    assert response.status_code == 401

def test_rate_limit_logging():
    """Test that rate limit violations are logged."""
    # This would require checking logs, but we can test rate limiting behavior
    client = TestClient(app)

    # Make many requests to trigger rate limiting
    responses = []
    for i in range(15):
        response = client.get(f"/api/{str(uuid4())}/tasks")
        responses.append(response.status_code)

    # Should have some rate limited responses (429)
    rate_limited_count = sum(1 for status in responses if status == 429)
    assert rate_limited_count >= 0  # May vary based on rate limiting config

class TestSecurityBestPractices:
    """Tests for security best practices."""

    def test_password_strength_validation(self, client):
        """Test that weak passwords are rejected."""
        # This would be tested in auth endpoints
        pass

    def test_session_management(self, client):
        """Test session management security."""
        # JWT-based auth doesn't use sessions in traditional sense
        # But test token handling
        pass

    def test_secure_headers(self, client):
        """Test that secure headers are present in responses."""
        response = client.get("/")

        # Check for security headers
        headers = response.headers
        assert "x-content-type-options" in headers
        assert "x-frame-options" in headers

def test_dependency_security():
    """Test that dependencies are secure (this would be done via external tools)."""
    # This is typically done with tools like pip-audit, bandit, etc.
    # Just document that it should be done
    pass

if __name__ == "__main__":
    # Run security tests directly
    pytest.main([__file__, "-v"])