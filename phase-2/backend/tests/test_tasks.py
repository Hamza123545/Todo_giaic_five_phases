"""
Basic task endpoint tests.
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_tasks_endpoint_requires_auth():
    """Test that tasks endpoint requires authentication."""
    # Try to access tasks without auth token
    response = client.get("/api/test-user-id/tasks")
    assert response.status_code in [401, 403]
