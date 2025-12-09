"""
Unit tests for task_service.py.

This module tests task service business logic with mocked dependencies.
"""

import pytest
from datetime import datetime, timedelta
from uuid import uuid4

from sqlmodel import Session
from services.task_service import TaskService
from models import Task


@pytest.mark.unit
class TestTaskService:
    """Test suite for TaskService class."""

    def test_create_task_success_returns_task_with_id(self, session: Session):
        """Test successful task creation returns task with generated ID."""
        # Arrange
        task_service = TaskService()
        user_id = uuid4()
        title = "Test Task"
        description = "Test Description"
        priority = "medium"

        # Act
        task = task_service.create_task(
            db=session,
            user_id=user_id,
            title=title,
            description=description,
            priority=priority
        )

        # Assert
        assert task is not None
        assert task.id is not None
        assert task.user_id == user_id
        assert task.title == title
        assert task.description == description
        assert task.priority == priority
        assert task.completed is False
        assert task.tags == []

    def test_create_task_with_all_fields_success(self, session: Session):
        """Test creating task with all optional fields succeeds."""
        # Arrange
        task_service = TaskService()
        user_id = uuid4()
        title = "Complete Task"
        description = "Full description"
        priority = "high"
        due_date = datetime.utcnow() + timedelta(days=7)
        tags = ["work", "urgent"]

        # Act
        task = task_service.create_task(
            db=session,
            user_id=user_id,
            title=title,
            description=description,
            priority=priority,
            due_date=due_date,
            tags=tags
        )

        # Assert
        assert task.title == title
        assert task.description == description
        assert task.priority == priority
        assert task.due_date == due_date
        assert task.tags == tags

    def test_create_task_empty_title_raises_value_error(self, session: Session):
        """Test creating task with empty title raises ValueError."""
        # Arrange
        task_service = TaskService()
        user_id = uuid4()
        empty_titles = ["", "   ", "\t", "\n"]

        # Act & Assert
        for empty_title in empty_titles:
            with pytest.raises(ValueError, match="Title is required"):
                task_service.create_task(
                    db=session,
                    user_id=user_id,
                    title=empty_title
                )

    def test_create_task_title_too_long_raises_value_error(self, session: Session):
        """Test creating task with title exceeding 200 characters raises ValueError."""
        # Arrange
        task_service = TaskService()
        user_id = uuid4()
        long_title = "A" * 201

        # Act & Assert
        with pytest.raises(ValueError, match="Title must be 200 characters or less"):
            task_service.create_task(
                db=session,
                user_id=user_id,
                title=long_title
            )

    def test_create_task_description_too_long_raises_value_error(self, session: Session):
        """Test creating task with description exceeding 1000 characters raises ValueError."""
        # Arrange
        task_service = TaskService()
        user_id = uuid4()
        title = "Test Task"
        long_description = "A" * 1001

        # Act & Assert
        with pytest.raises(ValueError, match="Description must be 1000 characters or less"):
            task_service.create_task(
                db=session,
                user_id=user_id,
                title=title,
                description=long_description
            )

    def test_create_task_invalid_priority_raises_value_error(self, session: Session):
        """Test creating task with invalid priority raises ValueError."""
        # Arrange
        task_service = TaskService()
        user_id = uuid4()
        title = "Test Task"
        invalid_priorities = ["urgent", "critical", "normal", "", "MEDIUM"]

        # Act & Assert
        for invalid_priority in invalid_priorities:
            with pytest.raises(ValueError, match="Priority must be one of: low, medium, high"):
                task_service.create_task(
                    db=session,
                    user_id=user_id,
                    title=title,
                    priority=invalid_priority
                )

    def test_create_task_past_due_date_raises_value_error(self, session: Session):
        """Test creating task with past due date raises ValueError."""
        # Arrange
        task_service = TaskService()
        user_id = uuid4()
        title = "Test Task"
        past_due_date = datetime.utcnow() - timedelta(days=1)

        # Act & Assert
        with pytest.raises(ValueError, match="Due date cannot be in the past"):
            task_service.create_task(
                db=session,
                user_id=user_id,
                title=title,
                due_date=past_due_date
            )

    def test_get_tasks_returns_all_user_tasks(self, session: Session, sample_tasks):
        """Test getting tasks returns all tasks for the user."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id

        # Act
        tasks, total_count = task_service.get_tasks(db=session, user_id=user_id)

        # Assert
        assert len(tasks) == 4
        assert total_count == 4
        assert all(task.user_id == user_id for task in tasks)

    def test_get_tasks_with_status_filter_pending(self, session: Session, sample_tasks):
        """Test filtering tasks by pending status."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id

        # Act
        tasks, total_count = task_service.get_tasks(
            db=session,
            user_id=user_id,
            status="pending"
        )

        # Assert
        assert all(not task.completed for task in tasks)
        assert len(tasks) == 3  # 3 pending tasks in sample data

    def test_get_tasks_with_status_filter_completed(self, session: Session, sample_tasks):
        """Test filtering tasks by completed status."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id

        # Act
        tasks, total_count = task_service.get_tasks(
            db=session,
            user_id=user_id,
            status="completed"
        )

        # Assert
        assert all(task.completed for task in tasks)
        assert len(tasks) == 1  # 1 completed task in sample data

    def test_get_tasks_with_priority_filter(self, session: Session, sample_tasks):
        """Test filtering tasks by priority level."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id

        # Act
        tasks, total_count = task_service.get_tasks(
            db=session,
            user_id=user_id,
            priority="high"
        )

        # Assert
        assert all(task.priority == "high" for task in tasks)
        assert len(tasks) == 2  # 2 high priority tasks in sample data

    def test_get_tasks_with_search_filter(self, session: Session, sample_tasks):
        """Test searching tasks by title and description."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id

        # Act
        tasks, total_count = task_service.get_tasks(
            db=session,
            user_id=user_id,
            search="overdue"
        )

        # Assert
        assert len(tasks) > 0
        assert any("overdue" in task.title.lower() or
                  (task.description and "overdue" in task.description.lower())
                  for task in tasks)

    def test_get_tasks_with_sorting_by_title(self, session: Session, sample_tasks):
        """Test sorting tasks by title."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id

        # Act - Sort ascending
        tasks_asc, _ = task_service.get_tasks(
            db=session,
            user_id=user_id,
            sort="title",
            sort_direction="asc"
        )

        # Act - Sort descending
        tasks_desc, _ = task_service.get_tasks(
            db=session,
            user_id=user_id,
            sort="title",
            sort_direction="desc"
        )

        # Assert
        assert tasks_asc[0].title < tasks_asc[-1].title
        assert tasks_desc[0].title > tasks_desc[-1].title

    def test_get_tasks_with_pagination(self, session: Session, sample_tasks):
        """Test pagination of task results."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id

        # Act - Page 1 with limit 2
        page1_tasks, total = task_service.get_tasks(
            db=session,
            user_id=user_id,
            page=1,
            limit=2
        )

        # Act - Page 2 with limit 2
        page2_tasks, _ = task_service.get_tasks(
            db=session,
            user_id=user_id,
            page=2,
            limit=2
        )

        # Assert
        assert len(page1_tasks) == 2
        assert len(page2_tasks) == 2
        assert total == 4
        assert page1_tasks[0].id != page2_tasks[0].id

    def test_get_task_by_id_success_returns_task(self, session: Session, sample_tasks):
        """Test getting task by ID returns correct task."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id
        task_id = sample_tasks[0].id

        # Act
        task = task_service.get_task_by_id(db=session, user_id=user_id, task_id=task_id)

        # Assert
        assert task is not None
        assert task.id == task_id
        assert task.user_id == user_id

    def test_get_task_by_id_wrong_user_returns_none(self, session: Session, sample_tasks):
        """Test getting task with wrong user_id returns None."""
        # Arrange
        task_service = TaskService()
        wrong_user_id = uuid4()
        task_id = sample_tasks[0].id

        # Act
        task = task_service.get_task_by_id(db=session, user_id=wrong_user_id, task_id=task_id)

        # Assert
        assert task is None

    def test_get_task_by_id_nonexistent_returns_none(self, session: Session, sample_tasks):
        """Test getting nonexistent task returns None."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id
        nonexistent_task_id = 99999

        # Act
        task = task_service.get_task_by_id(db=session, user_id=user_id, task_id=nonexistent_task_id)

        # Assert
        assert task is None

    def test_update_task_success_returns_updated_task(self, session: Session, sample_tasks):
        """Test updating task successfully returns updated task."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id
        task_id = sample_tasks[0].id
        new_title = "Updated Task Title"
        new_priority = "low"

        # Act
        updated_task = task_service.update_task(
            db=session,
            user_id=user_id,
            task_id=task_id,
            title=new_title,
            priority=new_priority
        )

        # Assert
        assert updated_task is not None
        assert updated_task.title == new_title
        assert updated_task.priority == new_priority

    def test_update_task_not_found_returns_none(self, session: Session, sample_tasks):
        """Test updating nonexistent task returns None."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id
        nonexistent_task_id = 99999

        # Act
        updated_task = task_service.update_task(
            db=session,
            user_id=user_id,
            task_id=nonexistent_task_id,
            title="New Title"
        )

        # Assert
        assert updated_task is None

    def test_update_task_invalid_title_raises_value_error(self, session: Session, sample_tasks):
        """Test updating task with invalid title raises ValueError."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id
        task_id = sample_tasks[0].id

        # Act & Assert
        with pytest.raises(ValueError, match="Title is required"):
            task_service.update_task(
                db=session,
                user_id=user_id,
                task_id=task_id,
                title=""
            )

    def test_delete_task_success_returns_true(self, session: Session, sample_tasks):
        """Test deleting task successfully returns True."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id
        task_id = sample_tasks[0].id

        # Act
        result = task_service.delete_task(db=session, user_id=user_id, task_id=task_id)

        # Assert
        assert result is True

        # Verify task is deleted
        deleted_task = task_service.get_task_by_id(db=session, user_id=user_id, task_id=task_id)
        assert deleted_task is None

    def test_delete_task_not_found_returns_false(self, session: Session, sample_tasks):
        """Test deleting nonexistent task returns False."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id
        nonexistent_task_id = 99999

        # Act
        result = task_service.delete_task(db=session, user_id=user_id, task_id=nonexistent_task_id)

        # Assert
        assert result is False

    def test_toggle_complete_success_changes_status(self, session: Session, sample_tasks):
        """Test toggling completion status successfully changes task status."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id
        task_id = sample_tasks[0].id
        original_status = sample_tasks[0].completed

        # Act
        updated_task = task_service.toggle_complete(
            db=session,
            user_id=user_id,
            task_id=task_id,
            completed=not original_status
        )

        # Assert
        assert updated_task is not None
        assert updated_task.completed == (not original_status)

    def test_toggle_complete_not_found_returns_none(self, session: Session, sample_tasks):
        """Test toggling completion of nonexistent task returns None."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id
        nonexistent_task_id = 99999

        # Act
        result = task_service.toggle_complete(
            db=session,
            user_id=user_id,
            task_id=nonexistent_task_id,
            completed=True
        )

        # Assert
        assert result is None

    def test_get_statistics_returns_correct_counts(self, session: Session, sample_tasks):
        """Test statistics calculation returns correct counts."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id

        # Act
        stats = task_service.get_statistics(db=session, user_id=user_id)

        # Assert
        assert stats['total'] == 4
        assert stats['completed'] == 1
        assert stats['pending'] == 3
        assert stats['overdue'] >= 1  # At least one overdue task

    def test_bulk_delete_success_returns_count(self, session: Session, sample_tasks):
        """Test bulk delete successfully deletes multiple tasks."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id
        task_ids = [sample_tasks[0].id, sample_tasks[1].id]

        # Act
        deleted_count = task_service.bulk_delete(db=session, user_id=user_id, task_ids=task_ids)

        # Assert
        assert deleted_count == 2

        # Verify tasks are deleted
        for task_id in task_ids:
            task = task_service.get_task_by_id(db=session, user_id=user_id, task_id=task_id)
            assert task is None

    def test_bulk_complete_success_returns_count(self, session: Session, sample_tasks):
        """Test bulk complete successfully marks multiple tasks complete."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id
        task_ids = [sample_tasks[0].id, sample_tasks[1].id]

        # Act
        updated_count = task_service.bulk_complete(db=session, user_id=user_id, task_ids=task_ids)

        # Assert
        assert updated_count == 2

        # Verify tasks are completed
        for task_id in task_ids:
            task = task_service.get_task_by_id(db=session, user_id=user_id, task_id=task_id)
            assert task.completed is True

    def test_bulk_pending_success_returns_count(self, session: Session, sample_tasks):
        """Test bulk pending successfully marks multiple tasks pending."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id
        task_ids = [sample_tasks[2].id]  # Task 3 is completed

        # Act
        updated_count = task_service.bulk_pending(db=session, user_id=user_id, task_ids=task_ids)

        # Assert
        assert updated_count == 1

        # Verify task is now pending
        task = task_service.get_task_by_id(db=session, user_id=user_id, task_id=task_ids[0])
        assert task.completed is False

    def test_bulk_priority_change_success_returns_count(self, session: Session, sample_tasks):
        """Test bulk priority change successfully updates multiple tasks."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id
        task_ids = [sample_tasks[0].id, sample_tasks[1].id]
        new_priority = "low"

        # Act
        updated_count = task_service.bulk_priority_change(
            db=session,
            user_id=user_id,
            task_ids=task_ids,
            priority=new_priority
        )

        # Assert
        assert updated_count == 2

        # Verify tasks have new priority
        for task_id in task_ids:
            task = task_service.get_task_by_id(db=session, user_id=user_id, task_id=task_id)
            assert task.priority == new_priority

    def test_bulk_priority_change_invalid_priority_raises_value_error(self, session: Session, sample_tasks):
        """Test bulk priority change with invalid priority raises ValueError."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id
        task_ids = [sample_tasks[0].id]

        # Act & Assert
        with pytest.raises(ValueError, match="Priority must be one of: low, medium, high"):
            task_service.bulk_priority_change(
                db=session,
                user_id=user_id,
                task_ids=task_ids,
                priority="urgent"
            )

    def test_bulk_operation_rollback_on_error(self, session: Session, sample_tasks):
        """Test bulk operation rolls back on error (task not found)."""
        # Arrange
        task_service = TaskService()
        user_id = sample_tasks[0].user_id
        task_ids = [sample_tasks[0].id, 99999]  # One valid, one invalid

        # Act & Assert
        with pytest.raises(Exception, match="not found"):
            task_service.bulk_delete(db=session, user_id=user_id, task_ids=task_ids)

        # Verify first task was NOT deleted (transaction rolled back)
        task = task_service.get_task_by_id(db=session, user_id=user_id, task_id=task_ids[0])
        assert task is not None
