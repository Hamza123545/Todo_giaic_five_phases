"""
Integration tests for database operations.

This module tests database CRUD operations, transactions, and data persistence.
"""

import pytest
from datetime import datetime, timedelta
from uuid import uuid4

from sqlmodel import Session
from models import User, Task
from services.auth_service import AuthService
from services.task_service import TaskService


@pytest.mark.integration
class TestDatabaseOperations:
    """Test suite for database operations with real database connections."""

    def test_user_creation_and_retrieval_persists_to_database(self, session: Session):
        """Test that user creation persists to database and can be retrieved."""
        # Arrange
        auth_service = AuthService()
        email = "persist@example.com"
        password = "password123"
        name = "Persist User"

        # Act - Create user
        created_user = auth_service.create_user(session, email, password, name)

        # Act - Retrieve user
        retrieved_user = auth_service.get_user_by_email(session, email)

        # Assert
        assert retrieved_user is not None
        assert retrieved_user.id == created_user.id
        assert retrieved_user.email == email
        assert retrieved_user.name == name
        assert retrieved_user.password_hash == created_user.password_hash

    def test_task_crud_operations_persist_correctly(self, session: Session, test_user: User):
        """Test full CRUD cycle for tasks persists correctly."""
        # Arrange
        task_service = TaskService()
        user_id = test_user.id

        # Act - Create
        created_task = task_service.create_task(
            db=session,
            user_id=user_id,
            title="CRUD Test Task",
            description="Testing CRUD operations",
            priority="high",
            tags=["test", "crud"]
        )
        task_id = created_task.id

        # Assert - Create
        assert created_task.id is not None
        assert created_task.title == "CRUD Test Task"

        # Act - Read
        read_task = task_service.get_task_by_id(session, user_id, task_id)

        # Assert - Read
        assert read_task is not None
        assert read_task.id == task_id
        assert read_task.title == "CRUD Test Task"

        # Act - Update
        updated_task = task_service.update_task(
            db=session,
            user_id=user_id,
            task_id=task_id,
            title="Updated Task Title",
            priority="low"
        )

        # Assert - Update
        assert updated_task.title == "Updated Task Title"
        assert updated_task.priority == "low"

        # Act - Delete
        delete_result = task_service.delete_task(session, user_id, task_id)

        # Assert - Delete
        assert delete_result is True

        # Verify deletion
        deleted_task = task_service.get_task_by_id(session, user_id, task_id)
        assert deleted_task is None

    def test_database_transactions_commit_on_success(self, session: Session, test_user: User):
        """Test that database transactions commit successfully on success."""
        # Arrange
        task_service = TaskService()
        user_id = test_user.id

        # Act - Create multiple tasks in same transaction
        task1 = task_service.create_task(session, user_id, "Task 1", priority="high")
        task2 = task_service.create_task(session, user_id, "Task 2", priority="medium")
        task3 = task_service.create_task(session, user_id, "Task 3", priority="low")

        # Assert - All tasks should be persisted
        all_tasks, count = task_service.get_tasks(session, user_id)
        assert count == 3
        assert len(all_tasks) == 3

    def test_database_transactions_rollback_on_error(self, session: Session, test_user: User):
        """Test that database transactions rollback on error."""
        # Arrange
        task_service = TaskService()
        user_id = test_user.id

        # Create valid tasks first
        task1 = task_service.create_task(session, user_id, "Task 1", priority="high")
        task2 = task_service.create_task(session, user_id, "Task 2", priority="medium")

        # Get initial count
        initial_tasks, initial_count = task_service.get_tasks(session, user_id)

        # Act - Try bulk operation with invalid task ID (should rollback)
        task_ids = [task1.id, 99999]  # One valid, one invalid

        # Assert - Should raise exception
        with pytest.raises(Exception):
            task_service.bulk_delete(session, user_id, task_ids)

        # Verify rollback - task1 should still exist
        remaining_tasks, remaining_count = task_service.get_tasks(session, user_id)
        assert remaining_count == initial_count
        assert any(task.id == task1.id for task in remaining_tasks)

    def test_user_isolation_in_queries(self, session: Session, test_user: User, test_user_2: User):
        """Test that queries properly isolate data by user_id."""
        # Arrange
        task_service = TaskService()

        # Create tasks for user 1
        task_service.create_task(session, test_user.id, "User 1 Task 1", priority="high")
        task_service.create_task(session, test_user.id, "User 1 Task 2", priority="medium")

        # Create tasks for user 2
        task_service.create_task(session, test_user_2.id, "User 2 Task 1", priority="high")

        # Act - Get tasks for each user
        user1_tasks, user1_count = task_service.get_tasks(session, test_user.id)
        user2_tasks, user2_count = task_service.get_tasks(session, test_user_2.id)

        # Assert - Each user should only see their own tasks
        assert user1_count == 2
        assert user2_count == 1
        assert all(task.user_id == test_user.id for task in user1_tasks)
        assert all(task.user_id == test_user_2.id for task in user2_tasks)

    def test_concurrent_operations_maintain_integrity(self, session: Session, test_user: User):
        """Test that concurrent-like operations maintain data integrity."""
        # Arrange
        task_service = TaskService()
        user_id = test_user.id

        # Act - Create task
        task = task_service.create_task(session, user_id, "Concurrent Task", priority="high")
        task_id = task.id

        # Simulate concurrent reads
        task_read1 = task_service.get_task_by_id(session, user_id, task_id)
        task_read2 = task_service.get_task_by_id(session, user_id, task_id)

        # Assert - Both reads should return same data
        assert task_read1.id == task_read2.id
        assert task_read1.title == task_read2.title
        assert task_read1.version == task_read2.version

        # Simulate concurrent update
        updated1 = task_service.update_task(session, user_id, task_id, title="Updated Title 1")

        # Assert - Update should succeed and be retrievable
        final_task = task_service.get_task_by_id(session, user_id, task_id)
        assert final_task.title == "Updated Title 1"

    def test_task_relationships_and_constraints(self, session: Session, test_user: User):
        """Test that database relationships and constraints are enforced."""
        # Arrange
        task_service = TaskService()
        user_id = test_user.id

        # Act - Create task with foreign key to user
        task = task_service.create_task(
            session,
            user_id,
            "Task with FK",
            description="Tests foreign key relationship"
        )

        # Assert - Task should have valid user_id relationship
        retrieved_task = task_service.get_task_by_id(session, user_id, task.id)
        assert retrieved_task.user_id == user_id

        # Verify user exists
        from sqlmodel import select
        user = session.exec(select(User).where(User.id == user_id)).first()
        assert user is not None
        assert user.id == user_id

    def test_query_filtering_and_sorting_with_real_data(self, session: Session, test_user: User):
        """Test complex query filtering and sorting with real database."""
        # Arrange
        task_service = TaskService()
        user_id = test_user.id

        # Create diverse set of tasks
        task_service.create_task(session, user_id, "Alpha Task", priority="high", tags=["alpha"])
        task_service.create_task(session, user_id, "Beta Task", priority="low", tags=["beta"])
        task_service.create_task(session, user_id, "Gamma Task", priority="medium", tags=["gamma"])

        # Mark one as completed
        all_tasks, _ = task_service.get_tasks(session, user_id)
        task_service.toggle_complete(session, user_id, all_tasks[0].id, True)

        # Act & Assert - Filter by status
        pending_tasks, pending_count = task_service.get_tasks(session, user_id, status="pending")
        assert pending_count == 2

        completed_tasks, completed_count = task_service.get_tasks(session, user_id, status="completed")
        assert completed_count == 1

        # Act & Assert - Sort by title
        sorted_tasks, _ = task_service.get_tasks(session, user_id, sort="title", sort_direction="asc")
        assert sorted_tasks[0].title < sorted_tasks[-1].title

        # Act & Assert - Filter by priority
        high_priority, high_count = task_service.get_tasks(session, user_id, priority="high")
        assert all(task.priority == "high" for task in high_priority)

    def test_bulk_operations_transactional_integrity(self, session: Session, test_user: User):
        """Test that bulk operations maintain transactional integrity."""
        # Arrange
        task_service = TaskService()
        user_id = test_user.id

        # Create multiple tasks
        tasks = []
        for i in range(5):
            task = task_service.create_task(session, user_id, f"Bulk Task {i}", priority="medium")
            tasks.append(task)

        task_ids = [task.id for task in tasks[:3]]  # First 3 tasks

        # Act - Bulk complete
        completed_count = task_service.bulk_complete(session, user_id, task_ids)

        # Assert
        assert completed_count == 3

        # Verify completion
        for task_id in task_ids:
            task = task_service.get_task_by_id(session, user_id, task_id)
            assert task.completed is True

        # Verify remaining tasks are not completed
        for task_id in [tasks[3].id, tasks[4].id]:
            task = task_service.get_task_by_id(session, user_id, task_id)
            assert task.completed is False

    def test_timestamp_fields_auto_update(self, session: Session, test_user: User):
        """Test that created_at and updated_at timestamps work correctly."""
        # Arrange
        task_service = TaskService()
        user_id = test_user.id

        # Act - Create task
        task = task_service.create_task(session, user_id, "Timestamp Test", priority="medium")

        # Assert - Timestamps should be set
        assert task.created_at is not None
        assert task.updated_at is not None
        original_updated_at = task.updated_at

        # Small delay to ensure timestamp difference
        import time
        time.sleep(0.1)

        # Act - Update task
        updated_task = task_service.update_task(session, user_id, task.id, title="Updated Timestamp")

        # Assert - updated_at should change, created_at should not
        assert updated_task.created_at == task.created_at
        assert updated_task.updated_at > original_updated_at
