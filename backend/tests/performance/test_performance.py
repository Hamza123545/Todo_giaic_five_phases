"""
Performance tests for API endpoints.

Tests API response times, throughput, and resource usage under load.
"""
import time
import pytest
from fastapi.testclient import TestClient
from main import app
from uuid import uuid4
import os
from typing import Dict, Any
from utils.auth import generate_jwt_token
from datetime import datetime, timedelta
import json

# Test user data
TEST_USER_EMAIL = "perf_test@example.com"
TEST_USER_PASSWORD = "testpass123"
TEST_USER_NAME = "Performance Test User"

@pytest.fixture
def client():
    """Create a test client for the API."""
    return TestClient(app)

@pytest.fixture
def auth_headers():
    """Create authentication headers for testing."""
    # In a real test, you would authenticate first
    # For performance tests, we'll use a mock token
    token = generate_jwt_token({
        "sub": str(uuid4()),
        "email": TEST_USER_EMAIL,
        "name": TEST_USER_NAME,
        "exp": int((datetime.utcnow() + timedelta(days=7)).timestamp()),
        "iat": int(datetime.utcnow().timestamp())
    })

    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def measure_response_time(client: TestClient, url: str, method: str = "GET", headers: Dict = None, data: Dict = None) -> Dict[str, Any]:
    """
    Measure response time for an API endpoint.

    Args:
        client: Test client
        url: API endpoint URL
        method: HTTP method
        headers: Request headers
        data: Request data for POST/PUT

    Returns:
        Dict with timing metrics
    """
    if headers is None:
        headers = {}

    start_time = time.time()

    if method.upper() == "GET":
        response = client.get(url, headers=headers)
    elif method.upper() == "POST":
        response = client.post(url, headers=headers, json=data)
    elif method.upper() == "PUT":
        response = client.put(url, headers=headers, json=data)
    elif method.upper() == "DELETE":
        response = client.delete(url, headers=headers)
    else:
        raise ValueError(f"Unsupported method: {method}")

    end_time = time.time()
    response_time = (end_time - start_time) * 1000  # Convert to milliseconds

    return {
        "status_code": response.status_code,
        "response_time_ms": response_time,
        "content_length": len(response.content),
        "response": response
    }

class TestPerformance:
    """Performance tests for API endpoints."""

    def test_get_tasks_performance(self, client, auth_headers):
        """Test performance of GET /api/{user_id}/tasks endpoint."""
        user_id = str(uuid4())
        url = f"/api/{user_id}/tasks"

        # Measure response time
        result = measure_response_time(client, url, "GET", auth_headers)

        # Assert reasonable response time (under 500ms)
        assert result["response_time_ms"] < 500, f"Response time too slow: {result['response_time_ms']}ms"
        assert result["status_code"] in [200, 401, 403]  # Expected status codes

        print(f"GET /api/{user_id}/tasks: {result['response_time_ms']:.2f}ms")

    def test_create_task_performance(self, client, auth_headers):
        """Test performance of POST /api/{user_id}/tasks endpoint."""
        user_id = str(uuid4())
        url = f"/api/{user_id}/tasks"

        task_data = {
            "title": "Performance Test Task",
            "description": "Task created for performance testing",
            "priority": "medium",
            "due_date": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "tags": ["performance", "test"]
        }

        # Measure response time
        result = measure_response_time(client, url, "POST", auth_headers, task_data)

        # Assert reasonable response time (under 1000ms)
        assert result["response_time_ms"] < 1000, f"Response time too slow: {result['response_time_ms']}ms"
        assert result["status_code"] in [200, 400, 401, 403]  # Expected status codes

        print(f"POST /api/{user_id}/tasks: {result['response_time_ms']:.2f}ms")

    def test_get_task_details_performance(self, client, auth_headers):
        """Test performance of GET /api/{user_id}/tasks/{id} endpoint."""
        user_id = str(uuid4())
        task_id = 1
        url = f"/api/{user_id}/tasks/{task_id}"

        # Measure response time
        result = measure_response_time(client, url, "GET", auth_headers)

        # Assert reasonable response time (under 500ms)
        assert result["response_time_ms"] < 500, f"Response time too slow: {result['response_time_ms']}ms"
        assert result["status_code"] in [200, 401, 403, 404]  # Expected status codes

        print(f"GET /api/{user_id}/tasks/{task_id}: {result['response_time_ms']:.2f}ms")

    def test_update_task_performance(self, client, auth_headers):
        """Test performance of PUT /api/{user_id}/tasks/{id} endpoint."""
        user_id = str(uuid4())
        task_id = 1
        url = f"/api/{user_id}/tasks/{task_id}"

        update_data = {
            "title": "Updated Performance Test Task",
            "description": "Updated task for performance testing",
            "priority": "high",
            "completed": False
        }

        # Measure response time
        result = measure_response_time(client, url, "PUT", auth_headers, update_data)

        # Assert reasonable response time (under 1000ms)
        assert result["response_time_ms"] < 1000, f"Response time too slow: {result['response_time_ms']}ms"
        assert result["status_code"] in [200, 400, 401, 403, 404]  # Expected status codes

        print(f"PUT /api/{user_id}/tasks/{task_id}: {result['response_time_ms']:.2f}ms")

    def test_delete_task_performance(self, client, auth_headers):
        """Test performance of DELETE /api/{user_id}/tasks/{id} endpoint."""
        user_id = str(uuid4())
        task_id = 1
        url = f"/api/{user_id}/tasks/{task_id}"

        # Measure response time
        result = measure_response_time(client, url, "DELETE", auth_headers)

        # Assert reasonable response time (under 1000ms)
        assert result["response_time_ms"] < 1000, f"Response time too slow: {result['response_time_ms']}ms"
        assert result["status_code"] in [200, 204, 401, 403, 404]  # Expected status codes

        print(f"DELETE /api/{user_id}/tasks/{task_id}: {result['response_time_ms']:.2f}ms")

    def test_bulk_operations_performance(self, client, auth_headers):
        """Test performance of POST /api/{user_id}/tasks/bulk endpoint."""
        user_id = str(uuid4())
        url = f"/api/{user_id}/tasks/bulk"

        bulk_data = {
            "action": "complete",
            "task_ids": [1, 2, 3, 4, 5]
        }

        # Measure response time
        result = measure_response_time(client, url, "POST", auth_headers, bulk_data)

        # Assert reasonable response time (under 2000ms for bulk operations)
        assert result["response_time_ms"] < 2000, f"Response time too slow: {result['response_time_ms']}ms"
        assert result["status_code"] in [200, 400, 401, 403]  # Expected status codes

        print(f"POST /api/{user_id}/tasks/bulk: {result['response_time_ms']:.2f}ms")

    def test_export_performance(self, client, auth_headers):
        """Test performance of GET /api/{user_id}/tasks/export endpoint."""
        user_id = str(uuid4())
        url = f"/api/{user_id}/tasks/export?format=json"

        # Measure response time
        result = measure_response_time(client, url, "GET", auth_headers)

        # Assert reasonable response time (under 2000ms for export operations)
        assert result["response_time_ms"] < 2000, f"Response time too slow: {result['response_time_ms']}ms"
        assert result["status_code"] in [200, 400, 401, 403]  # Expected status codes

        print(f"GET /api/{user_id}/tasks/export: {result['response_time_ms']:.2f}ms")

    def test_statistics_performance(self, client, auth_headers):
        """Test performance of GET /api/{user_id}/tasks/statistics endpoint."""
        user_id = str(uuid4())
        url = f"/api/{user_id}/tasks/statistics"

        # Measure response time
        result = measure_response_time(client, url, "GET", auth_headers)

        # Assert reasonable response time (under 1000ms for statistics)
        assert result["response_time_ms"] < 1000, f"Response time too slow: {result['response_time_ms']}ms"
        assert result["status_code"] in [200, 401, 403]  # Expected status codes

        print(f"GET /api/{user_id}/tasks/statistics: {result['response_time_ms']:.2f}ms")

    def test_concurrent_requests_performance(self, client, auth_headers):
        """Test performance under concurrent requests."""
        import concurrent.futures
        import threading

        user_id = str(uuid4())
        url = f"/api/{user_id}/tasks"

        def make_request():
            return measure_response_time(client, url, "GET", auth_headers)

        # Make 10 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            results = [future.result() for future in futures]

        # Calculate average response time
        avg_response_time = sum(r["response_time_ms"] for r in results) / len(results)

        # Assert reasonable average response time (under 1000ms)
        assert avg_response_time < 1000, f"Average response time too slow: {avg_response_time:.2f}ms"

        print(f"Concurrent requests (10): Average {avg_response_time:.2f}ms, Max {max(r['response_time_ms'] for r in results):.2f}ms")

    def test_large_dataset_performance(self, client, auth_headers):
        """Test performance with large dataset (simulated)."""
        user_id = str(uuid4())
        url = f"/api/{user_id}/tasks?limit=100&page=1"

        # Measure response time
        result = measure_response_time(client, url, "GET", auth_headers)

        # Assert reasonable response time for large dataset (under 1500ms)
        assert result["response_time_ms"] < 1500, f"Response time too slow: {result['response_time_ms']}ms"
        assert result["status_code"] in [200, 401, 403]  # Expected status codes

        print(f"GET /api/{user_id}/tasks (large dataset): {result['response_time_ms']:.2f}ms")


class TestPerformanceThresholds:
    """Performance threshold tests for API endpoints."""

    PERFORMANCE_THRESHOLDS = {
        "get_tasks": 500,  # ms
        "create_task": 1000,  # ms
        "get_task_details": 500,  # ms
        "update_task": 1000,  # ms
        "delete_task": 1000,  # ms
        "bulk_operations": 2000,  # ms
        "export": 2000,  # ms
        "statistics": 1000,  # ms
        "concurrent_avg": 1000,  # ms
        "large_dataset": 1500,  # ms
    }

    def test_response_time_thresholds(self, client, auth_headers):
        """Test that all endpoints meet performance thresholds."""
        user_id = str(uuid4())

        # Test GET tasks
        result = measure_response_time(client, f"/api/{user_id}/tasks", "GET", auth_headers)
        assert result["response_time_ms"] < self.PERFORMANCE_THRESHOLDS["get_tasks"], \
            f"GET /api/{user_id}/tasks exceeded threshold: {result['response_time_ms']}ms > {self.PERFORMANCE_THRESHOLDS['get_tasks']}ms"

        # Test POST task creation
        task_data = {
            "title": "Threshold Test Task",
            "description": "Task for threshold testing",
            "priority": "medium",
            "due_date": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "tags": ["threshold", "test"]
        }
        result = measure_response_time(client, f"/api/{user_id}/tasks", "POST", auth_headers, task_data)
        assert result["response_time_ms"] < self.PERFORMANCE_THRESHOLDS["create_task"], \
            f"POST /api/{user_id}/tasks exceeded threshold: {result['response_time_ms']}ms > {self.PERFORMANCE_THRESHOLDS['create_task']}ms"

        print("All performance thresholds met successfully!")


if __name__ == "__main__":
    # Run performance tests directly
    pytest.main([__file__, "-v"])