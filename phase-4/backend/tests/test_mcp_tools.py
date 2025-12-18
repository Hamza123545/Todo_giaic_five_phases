"""
Tests for MCP server tools - specifically bulk_update_tasks optimization.

This module tests the MCP tools that are exposed through the FastMCP server,
with focus on ensuring the optimized bulk_update_tasks implementation:
- Uses direct SQL UPDATE/DELETE statements (not ORM fetch-then-update)
- Completes in <100ms regardless of task count
- Properly enforces user isolation
- Returns correct counts and messages
"""

import os
import time
from uuid import uuid4
from unittest.mock import patch

# Set test environment BEFORE importing other modules
os.environ["ENVIRONMENT"] = "test"
os.environ["BETTER_AUTH_SECRET"] = "test-secret-key-for-jwt-token-generation"

import pytest
from sqlmodel import Session, select, update, delete
from models import Task, User
from utils.password import hash_password
from db import get_session


def mock_get_session(session: Session):
    """Create a mock for get_session that returns the fixture session."""
    def _mock():
        return iter([session])
    return patch("mcp_server.tools.get_session", _mock)


class TestBulkUpdateTasksOptimization:
    """Test suite for bulk_update_tasks MCP tool with optimized SQL implementation."""

    def test_bulk_complete_pending_tasks_uses_direct_sql(
        self, session: Session, user_factory, batch_task_factory, timer
    ):
        """Test bulk_update_tasks completes pending tasks efficiently with direct SQL."""
        from mcp_server.tools import bulk_update_tasks

        user = user_factory()
        user_id_value = user.id
        user_id = str(user_id_value)

        # Create mix of tasks
        batch_task_factory(count=20, user_id=user_id_value, completed=False, base_title="Pending")
        batch_task_factory(count=5, user_id=user_id_value, completed=True, base_title="Done")

        # Verify setup
        pending_before = len(session.exec(
            select(Task).where(Task.user_id == user_id_value, Task.completed == False)
        ).all())
        assert pending_before == 20

        # Run bulk complete with performance measurement
        with mock_get_session(session):
            with timer() as timing:
                result = bulk_update_tasks(user_id=user_id, action="complete", filter_status="pending")
            elapsed_ms = timing["elapsed"]

        # Verify result
        assert result["count"] == 20
        assert result["action"] == "completed"
        assert "20" in result["message"]

        # Critical performance check: <100ms proves direct SQL, not ORM loop
        assert elapsed_ms < 100, (
            f"Operation took {elapsed_ms:.1f}ms - indicates ORM loop instead of direct SQL. "
            f"Use: update(Task).values(completed=True)"
        )

        # Verify database state
        pending_after = len(session.exec(
            select(Task).where(Task.user_id == user_id_value, Task.completed == False)
        ).all())
        assert pending_after == 0

        total_completed = len(session.exec(
            select(Task).where(Task.user_id == user_id_value, Task.completed == True)
        ).all())
        assert total_completed == 25  # 5 original + 20 completed

    def test_bulk_delete_pending_tasks_uses_direct_sql(
        self, session: Session, user_factory, batch_task_factory, timer
    ):
        """Test bulk_update_tasks deletes pending tasks efficiently with direct SQL DELETE."""
        from mcp_server.tools import bulk_update_tasks

        user = user_factory()
        user_id_value = user.id
        user_id = str(user_id_value)

        batch_task_factory(count=30, user_id=user_id_value, completed=False)
        batch_task_factory(count=10, user_id=user_id_value, completed=True)

        # Run bulk delete with performance measurement
        with mock_get_session(session):
            with timer() as timing:
                result = bulk_update_tasks(user_id=user_id, action="delete", filter_status="pending")
            elapsed_ms = timing["elapsed"]

        assert result["count"] == 30
        assert result["action"] == "deleted"
        assert elapsed_ms < 100, (
            f"Delete took {elapsed_ms:.1f}ms - indicates ORM loop. "
            f"Use: delete(Task).where(...)"
        )

        # Verify deletion
        pending = len(session.exec(
            select(Task).where(Task.user_id == user_id_value, Task.completed == False)
        ).all())
        assert pending == 0

        completed = len(session.exec(
            select(Task).where(Task.user_id == user_id_value, Task.completed == True)
        ).all())
        assert completed == 10

    def test_bulk_update_enforces_user_isolation(
        self, session: Session, user_factory, batch_task_factory
    ):
        """Test bulk_update_tasks only affects specified user's tasks."""
        from mcp_server.tools import bulk_update_tasks

        user1 = user_factory()
        user1_id_value = user1.id
        user1_id = str(user1_id_value)

        user2 = user_factory()
        user2_id_value = user2.id

        batch_task_factory(count=5, user_id=user1_id_value, completed=False)
        batch_task_factory(count=5, user_id=user2_id_value, completed=False)

        with mock_get_session(session):
            result = bulk_update_tasks(user_id=user1_id, action="complete", filter_status="pending")

        assert result["count"] == 5

        # User1's tasks completed
        user1_pending = len(session.exec(
            select(Task).where(Task.user_id == user1_id_value, Task.completed == False)
        ).all())
        assert user1_pending == 0

        # User2's tasks unchanged
        user2_pending = len(session.exec(
            select(Task).where(Task.user_id == user2_id_value, Task.completed == False)
        ).all())
        assert user2_pending == 5

    def test_bulk_update_all_filter_status(
        self, session: Session, user_factory, batch_task_factory
    ):
        """Test bulk_update_tasks with filter_status='all' affects all tasks."""
        from mcp_server.tools import bulk_update_tasks

        user = user_factory()
        user_id_value = user.id
        user_id = str(user_id_value)

        batch_task_factory(count=10, user_id=user_id_value, completed=False)
        batch_task_factory(count=8, user_id=user_id_value, completed=True)

        with mock_get_session(session):
            result = bulk_update_tasks(user_id=user_id, action="complete", filter_status="all")

        assert result["count"] == 18

        all_completed = len(session.exec(
            select(Task).where(Task.user_id == user_id_value, Task.completed == True)
        ).all())
        assert all_completed == 18

    def test_bulk_delete_all_filter_status(
        self, session: Session, user_factory, batch_task_factory
    ):
        """Test bulk_update_tasks delete with filter_status='all' deletes all tasks."""
        from mcp_server.tools import bulk_update_tasks

        user = user_factory()
        user_id_value = user.id
        user_id = str(user_id_value)

        batch_task_factory(count=7, user_id=user_id_value, completed=False)
        batch_task_factory(count=6, user_id=user_id_value, completed=True)

        with mock_get_session(session):
            result = bulk_update_tasks(user_id=user_id, action="delete", filter_status="all")

        assert result["count"] == 13

        remaining = len(session.exec(
            select(Task).where(Task.user_id == user_id_value)
        ).all())
        assert remaining == 0

    def test_bulk_update_completed_filter(
        self, session: Session, user_factory, batch_task_factory
    ):
        """Test bulk_update_tasks with filter_status='completed'."""
        from mcp_server.tools import bulk_update_tasks

        user = user_factory()
        user_id_value = user.id
        user_id = str(user_id_value)

        batch_task_factory(count=5, user_id=user_id_value, completed=False)
        batch_task_factory(count=8, user_id=user_id_value, completed=True)

        with mock_get_session(session):
            result = bulk_update_tasks(user_id=user_id, action="delete", filter_status="completed")

        assert result["count"] == 8

        completed = len(session.exec(
            select(Task).where(Task.user_id == user_id_value, Task.completed == True)
        ).all())
        assert completed == 0

        pending = len(session.exec(
            select(Task).where(Task.user_id == user_id_value, Task.completed == False)
        ).all())
        assert pending == 5

    def test_bulk_update_response_format(
        self, session: Session, user_factory, batch_task_factory
    ):
        """Test bulk_update_tasks returns properly formatted response."""
        from mcp_server.tools import bulk_update_tasks

        user = user_factory()
        user_id = str(user.id)
        batch_task_factory(count=3, user_id=user.id, completed=False)

        with mock_get_session(session):
            result = bulk_update_tasks(user_id=user_id, action="complete", filter_status="pending")

        assert "count" in result and isinstance(result["count"], int)
        assert "action" in result and result["action"] in ["completed", "deleted"]
        assert "message" in result and isinstance(result["message"], str)

    def test_bulk_update_no_matching_tasks(self, session: Session, user_factory):
        """Test bulk_update_tasks returns count=0 when no tasks match filter."""
        from mcp_server.tools import bulk_update_tasks

        user = user_factory()
        user_id = str(user.id)

        with mock_get_session(session):
            result = bulk_update_tasks(user_id=user_id, action="complete", filter_status="pending")

        assert result["count"] == 0
        assert "No pending tasks found" in result["message"]

    def test_bulk_update_performance_with_large_dataset(
        self, session: Session, user_factory, batch_task_factory, timer
    ):
        """Test bulk_update_tasks performance with 100+ tasks (critical optimization test)."""
        from mcp_server.tools import bulk_update_tasks

        user = user_factory()
        user_id_value = user.id
        user_id = str(user_id_value)

        # Create 100 pending tasks - would timeout with ORM fetch-then-update
        batch_task_factory(count=100, user_id=user_id_value, completed=False)

        with mock_get_session(session):
            with timer() as timing:
                result = bulk_update_tasks(user_id=user_id, action="complete", filter_status="pending")
            elapsed_ms = timing["elapsed"]

        assert result["count"] == 100

        # CRITICAL ASSERTION: This proves we're using direct SQL, not ORM loop
        assert elapsed_ms < 100, (
            f"Bulk operation on 100 tasks took {elapsed_ms:.1f}ms. "
            f"ORM loop would take 5-10 seconds (timeout at 5s). "
            f"PROOF: Direct SQL UPDATE completes in <100ms."
        )

        remaining = len(session.exec(
            select(Task).where(Task.user_id == user_id_value, Task.completed == False)
        ).all())
        assert remaining == 0


class TestOtherMCPTools:
    """Quick sanity tests for other MCP tools."""

    def test_add_task_works(self, session: Session, user_factory):
        """Test add_task tool works correctly."""
        from mcp_server.tools import add_task

        user = user_factory()
        user_id = str(user.id)

        with mock_get_session(session):
            result = add_task(user_id=user_id, title="New Task", description="Test")

        assert result["status"] == "created"
        assert result["title"] == "New Task"
        assert "task_id" in result

    def test_list_tasks_works(self, session: Session, user_factory, batch_task_factory):
        """Test list_tasks tool works correctly."""
        from mcp_server.tools import list_tasks

        user = user_factory()
        user_id = str(user.id)
        batch_task_factory(count=5, user_id=user.id, completed=False)

        with mock_get_session(session):
            result = list_tasks(user_id=user_id, status="pending")

        assert result["count"] == 5
        assert len(result["tasks"]) == 5

    def test_complete_task_works(self, session: Session, user_factory, task_factory):
        """Test complete_task tool works correctly."""
        from mcp_server.tools import complete_task

        user = user_factory()
        user_id = str(user.id)
        task = task_factory(user_id=user.id, completed=False)

        with mock_get_session(session):
            result = complete_task(user_id=user_id, task_id=task.id)

        assert result["status"] == "completed"
        assert result["task_id"] == task.id

    def test_update_task_works(self, session: Session, user_factory, task_factory):
        """Test update_task tool works correctly."""
        from mcp_server.tools import update_task

        user = user_factory()
        user_id = str(user.id)
        task = task_factory(user_id=user.id, title="Original")

        with mock_get_session(session):
            result = update_task(user_id=user_id, task_id=task.id, title="Updated")

        assert result["status"] == "updated"
        assert result["title"] == "Updated"

    def test_delete_task_works(self, session: Session, user_factory, task_factory):
        """Test delete_task tool works correctly."""
        from mcp_server.tools import delete_task

        user = user_factory()
        user_id = str(user.id)
        task = task_factory(user_id=user.id)

        with mock_get_session(session):
            result = delete_task(user_id=user_id, task_id=task.id)

        assert result["status"] == "deleted"
        assert result["task_id"] == task.id
