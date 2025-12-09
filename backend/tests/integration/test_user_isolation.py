"""
Integration tests for user isolation.

This module tests that users cannot access or modify other users' data.
"""

import pytest
from uuid import uuid4

from sqlmodel import Session
from models import User
from services.task_service import TaskService


@pytest.mark.integration
class TestUserIsolation:
    """Test suite for user data isolation and security."""

    def test_cannot_access_other_user_tasks(self, session: Session, test_user: User, test_user_2: User):
        """Test that user cannot access another user's tasks."""
        # Arrange
        task_service = TaskService()

        # Create task for user 1
        user1_task = task_service.create_task(
            session,
            test_user.id,
            "User 1 Private Task",
            description="This belongs to user 1",
            priority="high"
        )

        # Act - Try to access user 1's task as user 2
        accessed_task = task_service.get_task_by_id(session, test_user_2.id, user1_task.id)

        # Assert - Should return None (not found for this user)
        assert accessed_task is None

    def test_cannot_update_other_user_tasks(self, session: Session, test_user: User, test_user_2: User):
        """Test that user cannot update another user's tasks."""
        # Arrange
        task_service = TaskService()

        # Create task for user 1
        user1_task = task_service.create_task(
            session,
            test_user.id,
            "User 1 Task",
            description="Original description",
            priority="high"
        )

        # Act - Try to update user 1's task as user 2
        updated_task = task_service.update_task(
            session,
            test_user_2.id,
            user1_task.id,
            title="Hacked Title",
            description="Hacked description"
        )

        # Assert - Update should fail (return None)
        assert updated_task is None

        # Verify original task unchanged
        original_task = task_service.get_task_by_id(session, test_user.id, user1_task.id)
        assert original_task.title == "User 1 Task"
        assert original_task.description == "Original description"

    def test_cannot_delete_other_user_tasks(self, session: Session, test_user: User, test_user_2: User):
        """Test that user cannot delete another user's tasks."""
        # Arrange
        task_service = TaskService()

        # Create task for user 1
        user1_task = task_service.create_task(
            session,
            test_user.id,
            "User 1 Task",
            priority="high"
        )

        # Act - Try to delete user 1's task as user 2
        delete_result = task_service.delete_task(session, test_user_2.id, user1_task.id)

        # Assert - Delete should fail
        assert delete_result is False

        # Verify task still exists for user 1
        existing_task = task_service.get_task_by_id(session, test_user.id, user1_task.id)
        assert existing_task is not None

    def test_cannot_toggle_complete_other_user_tasks(self, session: Session, test_user: User, test_user_2: User):
        """Test that user cannot toggle completion of another user's tasks."""
        # Arrange
        task_service = TaskService()

        # Create task for user 1
        user1_task = task_service.create_task(
            session,
            test_user.id,
            "User 1 Task",
            priority="high"
        )
        original_completed_status = user1_task.completed

        # Act - Try to toggle user 1's task as user 2
        toggled_task = task_service.toggle_complete(session, test_user_2.id, user1_task.id, True)

        # Assert - Toggle should fail
        assert toggled_task is None

        # Verify original task status unchanged
        original_task = task_service.get_task_by_id(session, test_user.id, user1_task.id)
        assert original_task.completed == original_completed_status

    def test_get_tasks_returns_only_own_tasks(self, session: Session, test_user: User, test_user_2: User):
        """Test that get_tasks only returns tasks belonging to the requesting user."""
        # Arrange
        task_service = TaskService()

        # Create tasks for user 1
        task_service.create_task(session, test_user.id, "User 1 Task 1", priority="high")
        task_service.create_task(session, test_user.id, "User 1 Task 2", priority="medium")

        # Create tasks for user 2
        task_service.create_task(session, test_user_2.id, "User 2 Task 1", priority="high")
        task_service.create_task(session, test_user_2.id, "User 2 Task 2", priority="low")
        task_service.create_task(session, test_user_2.id, "User 2 Task 3", priority="medium")

        # Act - Get tasks for each user
        user1_tasks, user1_count = task_service.get_tasks(session, test_user.id)
        user2_tasks, user2_count = task_service.get_tasks(session, test_user_2.id)

        # Assert - Each user only sees their own tasks
        assert user1_count == 2
        assert user2_count == 3
        assert all(task.user_id == test_user.id for task in user1_tasks)
        assert all(task.user_id == test_user_2.id for task in user2_tasks)

        # Verify no cross-contamination
        user1_task_ids = {task.id for task in user1_tasks}
        user2_task_ids = {task.id for task in user2_tasks}
        assert user1_task_ids.isdisjoint(user2_task_ids)

    def test_statistics_only_include_own_tasks(self, session: Session, test_user: User, test_user_2: User):
        """Test that statistics only include user's own tasks."""
        # Arrange
        task_service = TaskService()

        # Create tasks for user 1 (2 pending, 1 completed)
        task1 = task_service.create_task(session, test_user.id, "User 1 Task 1", priority="high")
        task2 = task_service.create_task(session, test_user.id, "User 1 Task 2", priority="medium")
        task3 = task_service.create_task(session, test_user.id, "User 1 Task 3", priority="low")
        task_service.toggle_complete(session, test_user.id, task3.id, True)

        # Create tasks for user 2 (1 pending, 2 completed)
        task4 = task_service.create_task(session, test_user_2.id, "User 2 Task 1", priority="high")
        task5 = task_service.create_task(session, test_user_2.id, "User 2 Task 2", priority="medium")
        task6 = task_service.create_task(session, test_user_2.id, "User 2 Task 3", priority="low")
        task_service.toggle_complete(session, test_user_2.id, task5.id, True)
        task_service.toggle_complete(session, test_user_2.id, task6.id, True)

        # Act
        user1_stats = task_service.get_statistics(session, test_user.id)
        user2_stats = task_service.get_statistics(session, test_user_2.id)

        # Assert - Each user's statistics are independent
        assert user1_stats['total'] == 3
        assert user1_stats['completed'] == 1
        assert user1_stats['pending'] == 2

        assert user2_stats['total'] == 3
        assert user2_stats['completed'] == 2
        assert user2_stats['pending'] == 1

    def test_cannot_bulk_delete_other_user_tasks(self, session: Session, test_user: User, test_user_2: User):
        """Test that bulk delete cannot affect other user's tasks."""
        # Arrange
        task_service = TaskService()

        # Create tasks for user 1
        user1_task1 = task_service.create_task(session, test_user.id, "User 1 Task 1", priority="high")
        user1_task2 = task_service.create_task(session, test_user.id, "User 1 Task 2", priority="medium")

        # Act - Try to bulk delete user 1's tasks as user 2
        task_ids = [user1_task1.id, user1_task2.id]

        # Assert - Should raise exception (tasks not found for this user)
        with pytest.raises(Exception, match="not found"):
            task_service.bulk_delete(session, test_user_2.id, task_ids)

        # Verify user 1's tasks still exist
        task1_exists = task_service.get_task_by_id(session, test_user.id, user1_task1.id)
        task2_exists = task_service.get_task_by_id(session, test_user.id, user1_task2.id)
        assert task1_exists is not None
        assert task2_exists is not None

    def test_cannot_bulk_complete_other_user_tasks(self, session: Session, test_user: User, test_user_2: User):
        """Test that bulk complete cannot affect other user's tasks."""
        # Arrange
        task_service = TaskService()

        # Create tasks for user 1
        user1_task1 = task_service.create_task(session, test_user.id, "User 1 Task 1", priority="high")
        user1_task2 = task_service.create_task(session, test_user.id, "User 1 Task 2", priority="medium")

        # Act - Try to bulk complete user 1's tasks as user 2
        task_ids = [user1_task1.id, user1_task2.id]

        # Assert - Should raise exception
        with pytest.raises(Exception, match="not found"):
            task_service.bulk_complete(session, test_user_2.id, task_ids)

        # Verify user 1's tasks remain uncompleted
        task1 = task_service.get_task_by_id(session, test_user.id, user1_task1.id)
        task2 = task_service.get_task_by_id(session, test_user.id, user1_task2.id)
        assert task1.completed is False
        assert task2.completed is False

    def test_cannot_bulk_priority_change_other_user_tasks(self, session: Session, test_user: User, test_user_2: User):
        """Test that bulk priority change cannot affect other user's tasks."""
        # Arrange
        task_service = TaskService()

        # Create tasks for user 1
        user1_task1 = task_service.create_task(session, test_user.id, "User 1 Task 1", priority="high")
        user1_task2 = task_service.create_task(session, test_user.id, "User 1 Task 2", priority="medium")

        # Act - Try to bulk change priority of user 1's tasks as user 2
        task_ids = [user1_task1.id, user1_task2.id]

        # Assert - Should raise exception
        with pytest.raises(Exception, match="not found"):
            task_service.bulk_priority_change(session, test_user_2.id, task_ids, "low")

        # Verify user 1's tasks retain original priority
        task1 = task_service.get_task_by_id(session, test_user.id, user1_task1.id)
        task2 = task_service.get_task_by_id(session, test_user.id, user1_task2.id)
        assert task1.priority == "high"
        assert task2.priority == "medium"

    def test_search_only_searches_own_tasks(self, session: Session, test_user: User, test_user_2: User):
        """Test that search functionality only searches user's own tasks."""
        # Arrange
        task_service = TaskService()

        # Create tasks with keyword for both users
        task_service.create_task(
            session,
            test_user.id,
            "Secret project task",
            description="User 1's secret project",
            priority="high"
        )
        task_service.create_task(
            session,
            test_user_2.id,
            "Another secret task",
            description="User 2's secret project",
            priority="high"
        )

        # Act - Search for "secret" as each user
        user1_results, user1_count = task_service.get_tasks(session, test_user.id, search="secret")
        user2_results, user2_count = task_service.get_tasks(session, test_user_2.id, search="secret")

        # Assert - Each user only finds their own task
        assert user1_count == 1
        assert user2_count == 1
        assert user1_results[0].user_id == test_user.id
        assert user2_results[0].user_id == test_user_2.id
        assert user1_results[0].id != user2_results[0].id

    def test_filter_by_tags_only_filters_own_tasks(self, session: Session, test_user: User, test_user_2: User):
        """Test that filtering by tags only applies to user's own tasks."""
        # Arrange
        task_service = TaskService()

        # Create tasks with same tag for both users
        task_service.create_task(
            session,
            test_user.id,
            "User 1 Work Task",
            tags=["work", "important"],
            priority="high"
        )
        task_service.create_task(
            session,
            test_user.id,
            "User 1 Personal Task",
            tags=["personal"],
            priority="medium"
        )
        task_service.create_task(
            session,
            test_user_2.id,
            "User 2 Work Task",
            tags=["work", "urgent"],
            priority="high"
        )

        # Act - Filter by "work" tag for each user
        user1_work, user1_count = task_service.get_tasks(session, test_user.id, tags="work")
        user2_work, user2_count = task_service.get_tasks(session, test_user_2.id, tags="work")

        # Assert - Each user only sees their own "work" tasks
        assert user1_count == 1
        assert user2_count == 1
        assert all(task.user_id == test_user.id for task in user1_work)
        assert all(task.user_id == test_user_2.id for task in user2_work)

    def test_pagination_respects_user_isolation(self, session: Session, test_user: User, test_user_2: User):
        """Test that pagination only paginates user's own tasks."""
        # Arrange
        task_service = TaskService()

        # Create 5 tasks for user 1
        for i in range(5):
            task_service.create_task(session, test_user.id, f"User 1 Task {i}", priority="medium")

        # Create 3 tasks for user 2
        for i in range(3):
            task_service.create_task(session, test_user_2.id, f"User 2 Task {i}", priority="medium")

        # Act - Get paginated results for each user
        user1_page1, user1_total = task_service.get_tasks(session, test_user.id, page=1, limit=3)
        user1_page2, _ = task_service.get_tasks(session, test_user.id, page=2, limit=3)
        user2_page1, user2_total = task_service.get_tasks(session, test_user_2.id, page=1, limit=3)

        # Assert
        assert user1_total == 5
        assert len(user1_page1) == 3
        assert len(user1_page2) == 2

        assert user2_total == 3
        assert len(user2_page1) == 3

        # Verify all tasks belong to correct user
        assert all(task.user_id == test_user.id for task in user1_page1)
        assert all(task.user_id == test_user.id for task in user1_page2)
        assert all(task.user_id == test_user_2.id for task in user2_page1)

    def test_nonexistent_user_returns_empty_results(self, session: Session):
        """Test that querying with nonexistent user_id returns empty results."""
        # Arrange
        task_service = TaskService()
        nonexistent_user_id = uuid4()

        # Act
        tasks, count = task_service.get_tasks(session, nonexistent_user_id)
        stats = task_service.get_statistics(session, nonexistent_user_id)

        # Assert
        assert count == 0
        assert len(tasks) == 0
        assert stats['total'] == 0
        assert stats['completed'] == 0
        assert stats['pending'] == 0
