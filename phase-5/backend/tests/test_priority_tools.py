"""
Tests for priority MCP tools - set_priority, list_tasks_by_priority, and priority detection.

This module tests the priority-related MCP tools that are exposed through the FastMCP server,
with focus on:
- Priority detection from natural language
- set_priority MCP tool functionality
- list_tasks_by_priority MCP tool with filtering
- add_task with priority detection
- update_task with priority support
"""

import os
from unittest.mock import patch

# Set test environment BEFORE importing other modules
os.environ["ENVIRONMENT"] = "test"
os.environ["BETTER_AUTH_SECRET"] = "test-secret-key-for-jwt-token-generation"

import pytest
from sqlmodel import Session

from models import Task, User
from mcp_server.tools import (
    detect_priority_from_text,
    add_task,
    set_priority,
    list_tasks_by_priority,
    update_task,
)
from utils.password import hash_password
from db import get_session


def mock_get_session(session: Session):
    """Create a mock for get_session that returns the fixture session."""
    def _mock():
        return iter([session])
    return patch("mcp_server.tools.get_session", _mock)


class TestPriorityDetection:
    """Test suite for priority detection from natural language text."""

    def test_detect_high_priority_explicit(self):
        """Test detection of 'high priority' phrase."""
        assert detect_priority_from_text("Create HIGH priority task") == "high"

    def test_detect_high_priority_urgent(self):
        """Test detection of 'urgent' keyword."""
        assert detect_priority_from_text("This is urgent") == "high"

    def test_detect_high_priority_critical(self):
        """Test detection of 'critical' keyword."""
        assert detect_priority_from_text("Critical task to complete") == "high"

    def test_detect_high_priority_important(self):
        """Test detection of 'important' keyword."""
        assert detect_priority_from_text("important meeting to attend") == "high"

    def test_detect_high_priority_asap(self):
        """Test detection of 'ASAP' keyword."""
        assert detect_priority_from_text("Fix this ASAP") == "high"

    def test_detect_low_priority_explicit(self):
        """Test detection of 'low priority' phrase."""
        assert detect_priority_from_text("This is a low priority task") == "low"

    def test_detect_low_priority_minor(self):
        """Test detection of 'minor' keyword."""
        assert detect_priority_from_text("minor bug fix") == "low"

    def test_detect_low_priority_optional(self):
        """Test detection of 'optional' keyword."""
        assert detect_priority_from_text("optional task to do") == "low"

    def test_detect_low_priority_when_time(self):
        """Test detection of 'when you have time' phrase."""
        assert detect_priority_from_text("do this when you have time") == "low"

    def test_detect_medium_priority_explicit(self):
        """Test detection of 'medium priority' phrase."""
        assert detect_priority_from_text("medium priority task") == "medium"

    def test_detect_medium_priority_normal(self):
        """Test detection of 'normal' keyword."""
        assert detect_priority_from_text("normal priority item") == "medium"

    def test_detect_default_priority(self):
        """Test default to medium priority when no keywords found."""
        assert detect_priority_from_text("Buy groceries") == "medium"
        assert detect_priority_from_text("Call the dentist") == "medium"

    def test_detect_case_insensitive(self):
        """Test case-insensitive priority detection."""
        assert detect_priority_from_text("HIGH PRIORITY TASK") == "high"
        assert detect_priority_from_text("LOW priority item") == "low"
        assert detect_priority_from_text("MedIum priority") == "medium"


class TestAddTaskWithPriority:
    """Test add_task MCP tool with priority detection and setting."""

    def test_add_task_with_detected_high_priority(self, session: Session, user_factory):
        """Test add_task detects high priority from title."""
        user = user_factory()
        user_id = str(user.id)

        with mock_get_session(session):
            result = add_task(
                user_id=user_id,
                title="Create URGENT task for important meeting",
                description="Fix critical issue"
            )

        assert result["status"] == "created"
        assert result["priority"] == "high"
        assert "task_id" in result

    def test_add_task_with_detected_low_priority(self, session: Session, user_factory):
        """Test add_task detects low priority from title."""
        user = user_factory()
        user_id = str(user.id)

        with mock_get_session(session):
            result = add_task(
                user_id=user_id,
                title="Minor task to do when you have time",
            )

        assert result["status"] == "created"
        assert result["priority"] == "low"

    def test_add_task_with_explicit_priority_high(self, session: Session, user_factory):
        """Test add_task with explicit high priority."""
        user = user_factory()
        user_id = str(user.id)

        with mock_get_session(session):
            result = add_task(
                user_id=user_id,
                title="Buy groceries",
                priority="high"
            )

        assert result["status"] == "created"
        assert result["priority"] == "high"

    def test_add_task_with_explicit_priority_medium(self, session: Session, user_factory):
        """Test add_task with explicit medium priority."""
        user = user_factory()
        user_id = str(user.id)

        with mock_get_session(session):
            result = add_task(
                user_id=user_id,
                title="Regular task",
                priority="medium"
            )

        assert result["status"] == "created"
        assert result["priority"] == "medium"

    def test_add_task_default_medium_priority(self, session: Session, user_factory):
        """Test add_task defaults to medium priority."""
        user = user_factory()
        user_id = str(user.id)

        with mock_get_session(session):
            result = add_task(
                user_id=user_id,
                title="Buy groceries",
            )

        assert result["status"] == "created"
        assert result["priority"] == "medium"

    def test_add_task_invalid_priority_defaults_to_medium(self, session: Session, user_factory):
        """Test add_task with invalid priority defaults to medium."""
        user = user_factory()
        user_id = str(user.id)

        with mock_get_session(session):
            result = add_task(
                user_id=user_id,
                title="Buy groceries",
                priority="INVALID"
            )

        assert result["status"] == "created"
        assert result["priority"] == "medium"

    def test_add_task_priority_case_insensitive(self, session: Session, user_factory):
        """Test add_task handles priority case-insensitively."""
        user = user_factory()
        user_id = str(user.id)

        with mock_get_session(session):
            result = add_task(
                user_id=user_id,
                title="Task",
                priority="HIGH"
            )

        assert result["priority"] == "high"


class TestSetPriorityTool:
    """Test set_priority MCP tool functionality."""

    def test_set_priority_high(self, session: Session, user_factory, task_factory):
        """Test setting task priority to high."""
        user = user_factory()
        user_id = str(user.id)
        task = task_factory(user_id=user.id, priority="medium")

        with mock_get_session(session):
            result = set_priority(user_id=user_id, task_id=task.id, priority="high")

        assert result["status"] == "updated"
        assert result["task_id"] == task.id
        assert result["priority"] == "high"

    def test_set_priority_low(self, session: Session, user_factory, task_factory):
        """Test setting task priority to low."""
        user = user_factory()
        user_id = str(user.id)
        task = task_factory(user_id=user.id, priority="medium")

        with mock_get_session(session):
            result = set_priority(user_id=user_id, task_id=task.id, priority="low")

        assert result["status"] == "updated"
        assert result["priority"] == "low"

    def test_set_priority_medium(self, session: Session, user_factory, task_factory):
        """Test setting task priority to medium."""
        user = user_factory()
        user_id = str(user.id)
        task = task_factory(user_id=user.id, priority="high")

        with mock_get_session(session):
            result = set_priority(user_id=user_id, task_id=task.id, priority="medium")

        assert result["status"] == "updated"
        assert result["priority"] == "medium"

    def test_set_priority_case_insensitive(self, session: Session, user_factory, task_factory):
        """Test set_priority is case-insensitive."""
        user = user_factory()
        user_id = str(user.id)
        task = task_factory(user_id=user.id)

        with mock_get_session(session):
            result = set_priority(user_id=user_id, task_id=task.id, priority="HIGH")

        assert result["priority"] == "high"

    def test_set_priority_invalid_raises_error(self, session: Session, user_factory, task_factory):
        """Test set_priority with invalid priority raises error."""
        from fastapi import HTTPException
        user = user_factory()
        user_id = str(user.id)
        task = task_factory(user_id=user.id)

        with mock_get_session(session):
            with pytest.raises(HTTPException):
                set_priority(user_id=user_id, task_id=task.id, priority="INVALID")

    def test_set_priority_enforces_user_isolation(self, session: Session, user_factory, task_factory):
        """Test set_priority only affects user's own tasks."""
        user1 = user_factory()
        user1_id = str(user1.id)

        user2 = user_factory()
        user2_id = str(user2.id)

        # Create task for user2
        task = task_factory(user_id=user2.id, priority="low")

        # Try to update task as user1 (should fail)
        with mock_get_session(session):
            with pytest.raises(Exception):  # HTTPException 404
                set_priority(user_id=user1_id, task_id=task.id, priority="high")


class TestListTasksByPriorityTool:
    """Test list_tasks_by_priority MCP tool functionality."""

    def test_list_high_priority_tasks(self, session: Session, user_factory, batch_task_factory):
        """Test listing only high priority tasks."""
        user = user_factory()
        user_id = str(user.id)

        # Create mix of priority tasks
        batch_task_factory(count=3, user_id=user.id, priority="high", completed=False)
        batch_task_factory(count=2, user_id=user.id, priority="medium", completed=False)
        batch_task_factory(count=1, user_id=user.id, priority="low", completed=False)

        with mock_get_session(session):
            result = list_tasks_by_priority(user_id=user_id, priority="high")

        assert result["count"] == 3
        assert result["priority"] == "high"
        assert all(task["priority"] == "high" for task in result["tasks"])

    def test_list_low_priority_tasks(self, session: Session, user_factory, batch_task_factory):
        """Test listing only low priority tasks."""
        user = user_factory()
        user_id = str(user.id)

        batch_task_factory(count=2, user_id=user.id, priority="high", completed=False)
        batch_task_factory(count=3, user_id=user.id, priority="low", completed=False)

        with mock_get_session(session):
            result = list_tasks_by_priority(user_id=user_id, priority="low")

        assert result["count"] == 3
        assert result["priority"] == "low"
        assert all(task["priority"] == "low" for task in result["tasks"])

    def test_list_priority_tasks_with_pending_filter(self, session: Session, user_factory, batch_task_factory):
        """Test listing high priority tasks with pending status filter."""
        user = user_factory()
        user_id = str(user.id)

        batch_task_factory(count=3, user_id=user.id, priority="high", completed=False)
        batch_task_factory(count=2, user_id=user.id, priority="high", completed=True)

        with mock_get_session(session):
            result = list_tasks_by_priority(
                user_id=user_id,
                priority="high",
                status="pending"
            )

        assert result["count"] == 3
        assert result["status"] == "pending"
        assert all(not task["completed"] for task in result["tasks"])

    def test_list_priority_tasks_with_completed_filter(self, session: Session, user_factory, batch_task_factory):
        """Test listing high priority tasks with completed status filter."""
        user = user_factory()
        user_id = str(user.id)

        batch_task_factory(count=2, user_id=user.id, priority="high", completed=False)
        batch_task_factory(count=3, user_id=user.id, priority="high", completed=True)

        with mock_get_session(session):
            result = list_tasks_by_priority(
                user_id=user_id,
                priority="high",
                status="completed"
            )

        assert result["count"] == 3
        assert result["status"] == "completed"
        assert all(task["completed"] for task in result["tasks"])

    def test_list_priority_tasks_all_status(self, session: Session, user_factory, batch_task_factory):
        """Test listing high priority tasks with all status filter."""
        user = user_factory()
        user_id = str(user.id)

        batch_task_factory(count=3, user_id=user.id, priority="high", completed=False)
        batch_task_factory(count=2, user_id=user.id, priority="high", completed=True)

        with mock_get_session(session):
            result = list_tasks_by_priority(
                user_id=user_id,
                priority="high",
                status="all"
            )

        assert result["count"] == 5
        assert result["status"] == "all"

    def test_list_priority_tasks_empty_result(self, session: Session, user_factory, batch_task_factory):
        """Test listing tasks when no tasks match priority."""
        user = user_factory()
        user_id = str(user.id)

        batch_task_factory(count=3, user_id=user.id, priority="low", completed=False)

        with mock_get_session(session):
            result = list_tasks_by_priority(user_id=user_id, priority="high")

        assert result["count"] == 0
        assert result["tasks"] == []

    def test_list_priority_tasks_enforces_user_isolation(self, session: Session, user_factory, batch_task_factory):
        """Test list_tasks_by_priority only shows user's own tasks."""
        user1 = user_factory()
        user1_id = str(user1.id)

        user2 = user_factory()
        user2_id = str(user2.id)

        # Create high priority tasks for user2
        batch_task_factory(count=3, user_id=user2.id, priority="high", completed=False)

        # User1 lists high priority tasks (should see none)
        with mock_get_session(session):
            result = list_tasks_by_priority(user_id=user1_id, priority="high")

        assert result["count"] == 0

    def test_list_priority_case_insensitive(self, session: Session, user_factory, batch_task_factory):
        """Test list_tasks_by_priority is case-insensitive."""
        user = user_factory()
        user_id = str(user.id)

        batch_task_factory(count=3, user_id=user.id, priority="high", completed=False)

        with mock_get_session(session):
            result = list_tasks_by_priority(user_id=user_id, priority="HIGH")

        assert result["count"] == 3

    def test_list_priority_invalid_priority_raises_error(self, session: Session, user_factory):
        """Test list_tasks_by_priority with invalid priority raises error."""
        from fastapi import HTTPException
        user = user_factory()
        user_id = str(user.id)

        with mock_get_session(session):
            with pytest.raises(HTTPException):
                list_tasks_by_priority(user_id=user_id, priority="INVALID")


class TestUpdateTaskWithPriority:
    """Test update_task MCP tool with priority support."""

    def test_update_task_priority_only(self, session: Session, user_factory, task_factory):
        """Test updating only priority field."""
        user = user_factory()
        user_id = str(user.id)
        task = task_factory(user_id=user.id, priority="medium", title="Original title")

        with mock_get_session(session):
            result = update_task(
                user_id=user_id,
                task_id=task.id,
                priority="high"
            )

        assert result["status"] == "updated"
        assert result["priority"] == "high"

    def test_update_task_priority_and_title(self, session: Session, user_factory, task_factory):
        """Test updating both title and priority."""
        user = user_factory()
        user_id = str(user.id)
        task = task_factory(user_id=user.id, priority="medium", title="Old title")

        with mock_get_session(session):
            result = update_task(
                user_id=user_id,
                task_id=task.id,
                title="New title",
                priority="high"
            )

        assert result["status"] == "updated"
        assert result["title"] == "New title"
        assert result["priority"] == "high"

    def test_update_task_priority_and_description(self, session: Session, user_factory, task_factory):
        """Test updating both description and priority."""
        user = user_factory()
        user_id = str(user.id)
        task = task_factory(user_id=user.id, priority="low", description="Old desc")

        with mock_get_session(session):
            result = update_task(
                user_id=user_id,
                task_id=task.id,
                description="New description",
                priority="medium"
            )

        assert result["status"] == "updated"
        assert result["priority"] == "medium"

    def test_update_task_invalid_priority_raises_error(self, session: Session, user_factory, task_factory):
        """Test update_task with invalid priority raises error."""
        from fastapi import HTTPException
        user = user_factory()
        user_id = str(user.id)
        task = task_factory(user_id=user.id)

        with mock_get_session(session):
            with pytest.raises(HTTPException):
                update_task(
                    user_id=user_id,
                    task_id=task.id,
                    priority="INVALID"
                )


class TestPriorityCombinations:
    """Test priority features in combination with other operations."""

    def test_create_high_priority_task_filter_and_update(
        self, session: Session, user_factory, batch_task_factory
    ):
        """Test end-to-end: create high priority, filter, then update."""
        user = user_factory()
        user_id = str(user.id)

        # 1. Create high priority task
        with mock_get_session(session):
            created = add_task(
                user_id=user_id,
                title="URGENT bug fix needed",
                description="Fix critical security issue"
            )

        assert created["priority"] == "high"
        task_id = created["task_id"]

        # 2. List high priority tasks
        with mock_get_session(session):
            high_tasks = list_tasks_by_priority(user_id=user_id, priority="high")

        assert high_tasks["count"] >= 1
        assert any(t["id"] == task_id for t in high_tasks["tasks"])

        # 3. Update priority to low
        with mock_get_session(session):
            updated = set_priority(user_id=user_id, task_id=task_id, priority="low")

        assert updated["priority"] == "low"

        # 4. Verify no longer in high priority list
        with mock_get_session(session):
            high_tasks = list_tasks_by_priority(user_id=user_id, priority="high")

        assert not any(t["id"] == task_id for t in high_tasks["tasks"])
