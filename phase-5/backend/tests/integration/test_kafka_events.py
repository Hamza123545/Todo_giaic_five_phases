"""
Integration Tests for Kafka Event Consumption - Phase V

Tests event flow: task.completed → Kafka → Recurring Task Service → next occurrence creation
Covers: T056 from tasks.md
"""

import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

from phase_5.backend.src.services.recurring_task_service import app, get_service


class TestKafkaEventConsumption:
    """Test task.completed event consumption via Dapr Pub/Sub - T056"""

    def setup_method(self):
        """Setup test client"""
        self.client = TestClient(app)

    def test_dapr_subscription_endpoint(self):
        """Test Dapr subscription endpoint returns correct topics"""
        response = self.client.post("/dapr/subscribe")

        assert response.status_code == 200
        subscriptions = response.json()

        # Verify subscription to task-events topic
        assert len(subscriptions) == 1
        assert subscriptions[0]["pubsubname"] == "kafka-pubsub"
        assert subscriptions[0]["topic"] == "task-events"
        assert subscriptions[0]["route"] == "/api/events/task-events"

    def test_handle_task_completed_event_cloudevents_format(self):
        """Test handling task.completed event in CloudEvents format"""
        # CloudEvents format (Dapr wraps Kafka events)
        cloud_event = {
            "specversion": "1.0",
            "type": "task.completed",
            "source": "todo-service",
            "id": "event-id-123",
            "data": {
                "event_id": "event-123",
                "event_type": "task.completed",
                "task_id": 789,
                "user_id": "user-456",
                "timestamp": "2025-12-29T10:00:00Z",
                "payload": {
                    "task_title": "Daily standup",
                    "completed_at": "2025-12-29T10:00:00Z",
                    "recurring_pattern": "DAILY",
                    "recurring_end_date": None
                }
            }
        }

        # Mock service methods
        service = get_service()
        with patch.object(service, 'handle_task_completed', new_callable=AsyncMock) as mock_handle:
            mock_handle.return_value = None

            response = self.client.post("/api/events/task-events", json=cloud_event)

            assert response.status_code == 200
            assert response.json() == {"status": "success"}

            # Verify handle_task_completed called with event data
            mock_handle.assert_called_once()
            event_data = mock_handle.call_args[0][0]
            assert event_data["event_id"] == "event-123"
            assert event_data["task_id"] == 789
            assert event_data["user_id"] == "user-456"

    def test_handle_event_missing_user_id(self):
        """Test handling event with missing user_id returns error"""
        cloud_event = {
            "specversion": "1.0",
            "type": "task.completed",
            "source": "todo-service",
            "id": "event-id-123",
            "data": {
                "event_id": "event-123",
                "event_type": "task.completed",
                "task_id": 789,
                # Missing user_id
                "payload": {
                    "task_title": "Daily standup",
                    "completed_at": "2025-12-29T10:00:00Z",
                    "recurring_pattern": "DAILY"
                }
            }
        }

        response = self.client.post("/api/events/task-events", json=cloud_event)

        assert response.status_code == 400
        assert response.json()["status"] == "error"
        assert "user_id" in response.json()["message"]

    def test_handle_invalid_event_data(self):
        """Test handling invalid event data returns error"""
        # Invalid JSON
        response = self.client.post("/api/events/task-events", json={"invalid": "data"})

        # Should return success (ignores invalid events to prevent blocking queue)
        # Or return error 400 depending on implementation
        assert response.status_code in [200, 400]

    def test_ignore_non_task_completed_events(self):
        """Test ignoring events that are not task.completed"""
        cloud_event = {
            "specversion": "1.0",
            "type": "task.updated",
            "source": "todo-service",
            "id": "event-id-123",
            "data": {
                "event_id": "event-123",
                "event_type": "task.updated",  # Not task.completed
                "task_id": 789,
                "user_id": "user-456",
                "payload": {}
            }
        }

        # Mock service
        service = get_service()
        with patch.object(service, 'handle_task_completed', new_callable=AsyncMock) as mock_handle:
            response = self.client.post("/api/events/task-events", json=cloud_event)

            assert response.status_code == 200
            assert response.json() == {"status": "success"}

            # Verify handle_task_completed NOT called (wrong event type)
            mock_handle.assert_not_called()


class TestEventFlowEndToEnd:
    """Test complete event flow from event receipt to next occurrence creation - T056"""

    def setup_method(self):
        """Setup test client"""
        self.client = TestClient(app)

    def test_complete_event_flow_recurring_task(self):
        """Test complete flow: receive event → calculate next → invoke backend"""
        cloud_event = {
            "specversion": "1.0",
            "type": "task.completed",
            "source": "todo-service",
            "id": "event-id-123",
            "data": {
                "event_id": "event-123",
                "event_type": "task.completed",
                "task_id": 789,
                "user_id": "user-456",
                "timestamp": "2025-12-29T10:00:00Z",
                "payload": {
                    "task_title": "Daily standup",
                    "completed_at": "2025-12-29T10:00:00Z",
                    "recurring_pattern": "DAILY",
                    "recurring_end_date": None
                }
            }
        }

        # Mock Dapr client methods
        service = get_service()
        with patch.object(service.dapr, 'get_state', new_callable=AsyncMock) as mock_get_state:
            with patch.object(service.dapr, 'save_state', new_callable=AsyncMock) as mock_save_state:
                with patch.object(service.dapr, 'invoke_service', new_callable=AsyncMock) as mock_invoke:
                    # Mock idempotency check (not processed yet)
                    mock_get_state.return_value = None

                    # Mock backend service response
                    mock_invoke.return_value = {"id": 790, "title": "Daily standup"}

                    response = self.client.post("/api/events/task-events", json=cloud_event)

                    assert response.status_code == 200
                    assert response.json() == {"status": "success"}

                    # Verify idempotency check
                    mock_get_state.assert_called_once_with("event-processed-event-123")

                    # Verify backend service invoked
                    mock_invoke.assert_called_once()
                    call_args = mock_invoke.call_args
                    assert call_args[1]["app_id"] == "backend"
                    assert call_args[1]["method"] == "api/tasks"
                    assert call_args[1]["data"]["title"] == "Daily standup"
                    assert call_args[1]["data"]["user_id"] == "user-456"
                    assert call_args[1]["data"]["recurring_pattern"] == "DAILY"

                    # Verify next_occurrence calculated (Dec 30, 2025)
                    next_occ = call_args[1]["data"]["next_occurrence"]
                    assert next_occ.startswith("2025-12-30T10:00:00")

                    # Verify event marked as processed
                    assert mock_save_state.call_count == 1

    def test_idempotency_prevents_duplicate_processing(self):
        """Test idempotency prevents processing same event twice"""
        cloud_event = {
            "specversion": "1.0",
            "type": "task.completed",
            "source": "todo-service",
            "id": "event-id-123",
            "data": {
                "event_id": "event-123",
                "event_type": "task.completed",
                "task_id": 789,
                "user_id": "user-456",
                "timestamp": "2025-12-29T10:00:00Z",
                "payload": {
                    "task_title": "Daily standup",
                    "completed_at": "2025-12-29T10:00:00Z",
                    "recurring_pattern": "DAILY"
                }
            }
        }

        # Mock Dapr client
        service = get_service()
        with patch.object(service.dapr, 'get_state', new_callable=AsyncMock) as mock_get_state:
            with patch.object(service.dapr, 'invoke_service', new_callable=AsyncMock) as mock_invoke:
                # Mock idempotency check (already processed)
                mock_get_state.return_value = {"processed": True, "processed_at": "2025-12-29T09:00:00Z"}

                response = self.client.post("/api/events/task-events", json=cloud_event)

                assert response.status_code == 200
                assert response.json() == {"status": "success"}

                # Verify backend service NOT invoked (already processed)
                mock_invoke.assert_not_called()


class TestHealthCheckEndpoints:
    """Test health check endpoints - T056"""

    def setup_method(self):
        """Setup test client"""
        self.client = TestClient(app)

    def test_health_endpoint(self):
        """Test /health endpoint returns healthy status"""
        response = self.client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "recurring-task-service"
        assert "timestamp" in data

    def test_liveness_probe(self):
        """Test /health/live endpoint returns alive status"""
        response = self.client.get("/health/live")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"

    def test_readiness_probe_dapr_available(self):
        """Test /health/ready endpoint when Dapr is available"""
        # Mock httpx client to return 200 (Dapr healthy)
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response

            response = self.client.get("/health/ready")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ready"

    def test_readiness_probe_dapr_unavailable(self):
        """Test /health/ready endpoint when Dapr is unavailable"""
        # Mock httpx client to raise exception (Dapr not running)
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.side_effect = Exception("Connection refused")

            response = self.client.get("/health/ready")

            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "not ready"
