"""
Basic tests for main application endpoints.

This module tests the health check and root endpoints.
"""

from fastapi.testclient import TestClient


def test_root_endpoint(client: TestClient):
    """Test root endpoint returns API information."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "Todo API is running"
    assert data["version"] == "1.0.0"
    assert data["docs"] == "/docs"
    assert data["redoc"] == "/redoc"


def test_health_endpoint(client: TestClient):
    """Test health check endpoint returns healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "healthy"
    assert data["message"] == "API is operational"


def test_api_health_endpoint(client: TestClient):
    """Test API health check endpoint under /api prefix."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "healthy"
    assert data["message"] == "API is operational"
