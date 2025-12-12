"""
Basic authentication tests.
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_auth_endpoints_exist():
    """Test that auth endpoints are accessible."""
    # Test signup endpoint (should return 422 for missing data)
    response = client.post("/api/auth/signup", json={})
    assert response.status_code in [400, 422]

    # Test signin endpoint (should return 422 for missing data)
    response = client.post("/api/auth/signin", json={})
    assert response.status_code in [400, 422]
