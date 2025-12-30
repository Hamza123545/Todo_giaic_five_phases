"""
Unit Tests for Recurring Task Service - Phase V

Tests next occurrence creation logic, idempotency, and event handling.
Covers: T055 from tasks.md
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from phase_5.backend.src.services.recurring_task_service import RecurringTaskService


class TestRecurringTaskServiceIdempotency:
    """Test idempotency checks - T055"""

    @pytest.mark.asyncio
    async def test_check_idempotency_not_processed(self):
        """Test idempotency check when event not processed"""
        service = RecurringTaskService()

        # Mock Dapr client to return None (not processed)
        with patch.object(service.dapr, 'get_state', new_callable=AsyncMock) as mock_get_state:
            mock_get_state.return_value = None

            is_processed = await service.check_idempotency("event-123")

            assert is_processed is False
            mock_get_state.assert_called_once_with("event-processed-event-123")

    @pytest.mark.asyncio
    async def test_check_idempotency_already_processed(self):
        """Test idempotency check when event already processed"""
        service = RecurringTaskService()

        # Mock Dapr client to return processed state
        with patch.object(service.dapr, 'get_state', new_callable=AsyncMock) as mock_get_state:
            mock_get_state.return_value = {"processed": True, "processed_at": "2025-12-29T10:00:00Z"}

            is_processed = await service.check_idempotency("event-123")

            assert is_processed is True
            mock_get_state.assert_called_once_with("event-processed-event-123")

    @pytest.mark.asyncio
    async def test_mark_event_processed(self):
        """Test marking event as processed"""
        service = RecurringTaskService()

        # Mock Dapr client save_state
        with patch.object(service.dapr, 'save_state', new_callable=AsyncMock) as mock_save_state:
            await service.mark_event_processed("event-123")

            # Verify save_state called with correct key and value
            mock_save_state.assert_called_once()
            call_args = mock_save_state.call_args
            assert call_args[0][0] == "event-processed-event-123"
            assert call_args[0][1]["processed"] is True
            assert "processed_at" in call_args[0][1]


class TestRecurringTaskServiceNextOccurrence:
    """Test next occurrence creation logic - T055"""

    @pytest.mark.asyncio
    async def test_handle_non_recurring_task(self):
        """Test handling task.completed event for non-recurring task"""
        service = RecurringTaskService()

        event_data = {
            "event_id": "event-123",
            "event_type": "task.completed",
            "user_id": "user-456",
            "task_id": 789,
            "payload": {
                "task_title": "Buy groceries",
                "completed_at": "2025-12-29T10:00:00Z",
                "recurring_pattern": None  # Not recurring
            }
        }

        # Mock idempotency and mark processed
        with patch.object(service, 'check_idempotency', new_callable=AsyncMock) as mock_check:
            with patch.object(service, 'mark_event_processed', new_callable=AsyncMock) as mock_mark:
                with patch.object(service.dapr, 'invoke_service', new_callable=AsyncMock) as mock_invoke:
                    mock_check.return_value = False

                    await service.handle_task_completed(event_data)

                    # Verify idempotency check called
                    mock_check.assert_called_once_with("event-123")

                    # Verify event marked as processed
                    mock_mark.assert_called_once_with("event-123")

                    # Verify backend service NOT called (non-recurring)
                    mock_invoke.assert_not_called()

    @pytest.mark.asyncio
    async def test_handle_recurring_task_daily(self):
        """Test handling task.completed event for daily recurring task"""
        service = RecurringTaskService()

        event_data = {
            "event_id": "event-123",
            "event_type": "task.completed",
            "user_id": "user-456",
            "task_id": 789,
            "payload": {
                "task_title": "Daily standup",
                "completed_at": "2025-12-29T10:00:00Z",
                "recurring_pattern": "DAILY",
                "recurring_end_date": None  # Infinite recurrence
            }
        }

        # Mock idempotency and backend service
        with patch.object(service, 'check_idempotency', new_callable=AsyncMock) as mock_check:
            with patch.object(service, 'mark_event_processed', new_callable=AsyncMock) as mock_mark:
                with patch.object(service.dapr, 'invoke_service', new_callable=AsyncMock) as mock_invoke:
                    mock_check.return_value = False
                    mock_invoke.return_value = {"id": 790, "title": "Daily standup"}

                    await service.handle_task_completed(event_data)

                    # Verify backend service called to create next occurrence
                    mock_invoke.assert_called_once()
                    call_args = mock_invoke.call_args
                    assert call_args[1]["app_id"] == "backend"
                    assert call_args[1]["method"] == "api/tasks"
                    assert call_args[1]["data"]["title"] == "Daily standup"
                    assert call_args[1]["data"]["user_id"] == "user-456"
                    assert call_args[1]["data"]["recurring_pattern"] == "DAILY"
                    assert call_args[1]["data"]["parent_task_id"] == 789

                    # Verify next_occurrence is 1 day later (Dec 30, 2025)
                    next_occ = call_args[1]["data"]["next_occurrence"]
                    assert next_occ.startswith("2025-12-30T10:00:00")

                    # Verify event marked as processed
                    mock_mark.assert_called_once_with("event-123")

    @pytest.mark.asyncio
    async def test_handle_recurring_task_with_end_date(self):
        """Test recurring task with end date"""
        service = RecurringTaskService()

        event_data = {
            "event_id": "event-123",
            "event_type": "task.completed",
            "user_id": "user-456",
            "task_id": 789,
            "payload": {
                "task_title": "Weekly meeting",
                "completed_at": "2025-12-29T10:00:00Z",
                "recurring_pattern": "WEEKLY",
                "recurring_end_date": "2025-12-30T23:59:59Z"  # End next day
            }
        }

        # Mock idempotency
        with patch.object(service, 'check_idempotency', new_callable=AsyncMock) as mock_check:
            with patch.object(service, 'mark_event_processed', new_callable=AsyncMock) as mock_mark:
                with patch.object(service.dapr, 'invoke_service', new_callable=AsyncMock) as mock_invoke:
                    mock_check.return_value = False

                    await service.handle_task_completed(event_data)

                    # Next weekly occurrence would be Jan 5, 2026 (1 week later)
                    # But end_date is Dec 30, 2025 - so no next occurrence should be created

                    # Verify backend service NOT called (end date reached)
                    mock_invoke.assert_not_called()

                    # Verify event marked as processed
                    mock_mark.assert_called_once_with("event-123")

    @pytest.mark.asyncio
    async def test_skip_already_processed_event(self):
        """Test skipping event that was already processed"""
        service = RecurringTaskService()

        event_data = {
            "event_id": "event-123",
            "event_type": "task.completed",
            "user_id": "user-456",
            "task_id": 789,
            "payload": {
                "task_title": "Daily standup",
                "completed_at": "2025-12-29T10:00:00Z",
                "recurring_pattern": "DAILY"
            }
        }

        # Mock idempotency check to return True (already processed)
        with patch.object(service, 'check_idempotency', new_callable=AsyncMock) as mock_check:
            with patch.object(service.dapr, 'invoke_service', new_callable=AsyncMock) as mock_invoke:
                mock_check.return_value = True  # Already processed

                await service.handle_task_completed(event_data)

                # Verify backend service NOT called (already processed)
                mock_invoke.assert_not_called()

    @pytest.mark.asyncio
    async def test_handle_missing_required_fields(self):
        """Test handling event with missing required fields"""
        service = RecurringTaskService()

        # Missing user_id
        event_data = {
            "event_id": "event-123",
            "event_type": "task.completed",
            "task_id": 789,
            "payload": {}
        }

        with pytest.raises(ValueError, match="Missing required fields"):
            await service.handle_task_completed(event_data)

    @pytest.mark.asyncio
    async def test_handle_invalid_rrule_pattern(self):
        """Test handling task with invalid RRULE pattern"""
        service = RecurringTaskService()

        event_data = {
            "event_id": "event-123",
            "event_type": "task.completed",
            "user_id": "user-456",
            "task_id": 789,
            "payload": {
                "task_title": "Invalid task",
                "completed_at": "2025-12-29T10:00:00Z",
                "recurring_pattern": "INVALID_PATTERN"  # Invalid RRULE
            }
        }

        # Mock idempotency
        with patch.object(service, 'check_idempotency', new_callable=AsyncMock) as mock_check:
            with patch.object(service, 'mark_event_processed', new_callable=AsyncMock) as mock_mark:
                mock_check.return_value = False

                # Should raise ValueError from RRULE parser
                with pytest.raises(ValueError):
                    await service.handle_task_completed(event_data)

                # Event should be marked as processed to prevent infinite retries
                mock_mark.assert_called_once_with("event-123")


class TestRecurringTaskServiceUserIsolation:
    """Test user isolation - T055"""

    @pytest.mark.asyncio
    async def test_user_id_propagated_to_backend(self):
        """Test that user_id is propagated to backend service"""
        service = RecurringTaskService()

        event_data = {
            "event_id": "event-123",
            "event_type": "task.completed",
            "user_id": "user-456",
            "task_id": 789,
            "payload": {
                "task_title": "Daily standup",
                "completed_at": "2025-12-29T10:00:00Z",
                "recurring_pattern": "DAILY"
            }
        }

        # Mock idempotency and backend service
        with patch.object(service, 'check_idempotency', new_callable=AsyncMock) as mock_check:
            with patch.object(service, 'mark_event_processed', new_callable=AsyncMock) as mock_mark:
                with patch.object(service.dapr, 'invoke_service', new_callable=AsyncMock) as mock_invoke:
                    mock_check.return_value = False
                    mock_invoke.return_value = {"id": 790}

                    await service.handle_task_completed(event_data)

                    # Verify user_id propagated to backend
                    call_args = mock_invoke.call_args
                    assert call_args[1]["data"]["user_id"] == "user-456"


class TestRecurringTaskServiceErrorHandling:
    """Test error handling and retries - T055"""

    @pytest.mark.asyncio
    async def test_backend_service_failure_does_not_mark_processed(self):
        """Test that backend service failure prevents marking event as processed"""
        service = RecurringTaskService()

        event_data = {
            "event_id": "event-123",
            "event_type": "task.completed",
            "user_id": "user-456",
            "task_id": 789,
            "payload": {
                "task_title": "Daily standup",
                "completed_at": "2025-12-29T10:00:00Z",
                "recurring_pattern": "DAILY"
            }
        }

        # Mock idempotency and backend service failure
        with patch.object(service, 'check_idempotency', new_callable=AsyncMock) as mock_check:
            with patch.object(service, 'mark_event_processed', new_callable=AsyncMock) as mock_mark:
                with patch.object(service.dapr, 'invoke_service', new_callable=AsyncMock) as mock_invoke:
                    mock_check.return_value = False
                    mock_invoke.side_effect = Exception("Backend service unavailable")

                    # Should raise exception
                    with pytest.raises(Exception, match="Backend service unavailable"):
                        await service.handle_task_completed(event_data)

                    # Verify event NOT marked as processed (allows retry)
                    mock_mark.assert_not_called()
