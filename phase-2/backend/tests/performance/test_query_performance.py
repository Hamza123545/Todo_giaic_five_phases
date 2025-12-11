"""
Performance tests for query operations.

This module tests query performance with large datasets to ensure
the application can handle 1000+ tasks efficiently.
"""

import time
from datetime import datetime, timedelta
from uuid import uuid4

import pytest
from sqlmodel import Session

from models import Task
from schemas.query_params import TaskQueryParams
from services.task_service import TaskService


@pytest.fixture
def large_dataset(session: Session):
    """Create a large dataset of 1000+ tasks for performance testing."""
    user_id = uuid4()
    tasks = []

    # Create 1500 tasks with varied data
    priorities = ["low", "medium", "high"]
    for i in range(1500):
        task = Task(
            user_id=user_id,
            title=f"Performance Task {i}",
            description=f"Description for task {i} with some searchable content",
            priority=priorities[i % 3],
            completed=(i % 3 == 0),  # 33% completed
            due_date=datetime.now() + timedelta(days=(i % 30)),
            tags=[f"tag{i % 10}", f"category{i % 5}"],
        )
        tasks.append(task)

    session.add_all(tasks)
    session.commit()

    return {"user_id": user_id, "task_count": 1500}


class TestQueryPerformance:
    """Tests for query performance with large datasets."""

    def test_get_all_tasks_with_pagination_completes_under_500ms(
        self, session: Session, large_dataset
    ):
        """Test retrieving paginated tasks completes within 500ms."""
        # Arrange
        user_id = large_dataset["user_id"]
        query_params = TaskQueryParams(page=1, limit=50)

        # Act
        start_time = time.time()
        tasks, metadata = TaskService.get_tasks(session, user_id, query_params)
        end_time = time.time()

        # Assert
        execution_time = (end_time - start_time) * 1000  # Convert to ms
        assert execution_time < 500, f"Query took {execution_time}ms, expected < 500ms"
        assert len(tasks) == 50
        assert metadata["total"] == 1500

    def test_filtered_query_with_status_completes_under_500ms(
        self, session: Session, large_dataset
    ):
        """Test filtering by status completes within 500ms."""
        # Arrange
        user_id = large_dataset["user_id"]
        query_params = TaskQueryParams(status="completed", page=1, limit=50)

        # Act
        start_time = time.time()
        tasks, metadata = TaskService.get_tasks(session, user_id, query_params)
        end_time = time.time()

        # Assert
        execution_time = (end_time - start_time) * 1000
        assert execution_time < 500, f"Filtered query took {execution_time}ms, expected < 500ms"
        assert all(task.completed for task in tasks)

    def test_filtered_query_with_priority_completes_under_500ms(
        self, session: Session, large_dataset
    ):
        """Test filtering by priority completes within 500ms."""
        # Arrange
        user_id = large_dataset["user_id"]
        query_params = TaskQueryParams(priority="high", page=1, limit=50)

        # Act
        start_time = time.time()
        tasks, metadata = TaskService.get_tasks(session, user_id, query_params)
        end_time = time.time()

        # Assert
        execution_time = (end_time - start_time) * 1000
        assert (
            execution_time < 500
        ), f"Priority filter query took {execution_time}ms, expected < 500ms"
        assert all(task.priority == "high" for task in tasks)

    def test_search_query_completes_under_500ms(self, session: Session, large_dataset):
        """Test full-text search completes within 500ms."""
        # Arrange
        user_id = large_dataset["user_id"]
        query_params = TaskQueryParams(search="Performance Task 10", page=1, limit=50)

        # Act
        start_time = time.time()
        tasks, metadata = TaskService.get_tasks(session, user_id, query_params)
        end_time = time.time()

        # Assert
        execution_time = (end_time - start_time) * 1000
        assert execution_time < 500, f"Search query took {execution_time}ms, expected < 500ms"
        assert len(tasks) > 0

    def test_sorting_by_title_completes_under_500ms(self, session: Session, large_dataset):
        """Test sorting by title completes within 500ms."""
        # Arrange
        user_id = large_dataset["user_id"]
        query_params = TaskQueryParams(sort="title:asc", page=1, limit=50)

        # Act
        start_time = time.time()
        tasks, metadata = TaskService.get_tasks(session, user_id, query_params)
        end_time = time.time()

        # Assert
        execution_time = (end_time - start_time) * 1000
        assert execution_time < 500, f"Sort query took {execution_time}ms, expected < 500ms"
        # Verify tasks are sorted
        titles = [task.title for task in tasks]
        assert titles == sorted(titles)

    def test_sorting_by_due_date_completes_under_500ms(self, session: Session, large_dataset):
        """Test sorting by due_date completes within 500ms."""
        # Arrange
        user_id = large_dataset["user_id"]
        query_params = TaskQueryParams(sort="due_date:asc", page=1, limit=50)

        # Act
        start_time = time.time()
        tasks, metadata = TaskService.get_tasks(session, user_id, query_params)
        end_time = time.time()

        # Assert
        execution_time = (end_time - start_time) * 1000
        assert (
            execution_time < 500
        ), f"Due date sort query took {execution_time}ms, expected < 500ms"

    def test_combined_filters_completes_under_500ms(self, session: Session, large_dataset):
        """Test combined filtering, sorting, and search completes within 500ms."""
        # Arrange
        user_id = large_dataset["user_id"]
        query_params = TaskQueryParams(
            status="pending",
            priority="high",
            search="Performance",
            sort="created:desc",
            page=1,
            limit=50,
        )

        # Act
        start_time = time.time()
        tasks, metadata = TaskService.get_tasks(session, user_id, query_params)
        end_time = time.time()

        # Assert
        execution_time = (end_time - start_time) * 1000
        assert (
            execution_time < 500
        ), f"Combined query took {execution_time}ms, expected < 500ms"

    def test_pagination_across_large_dataset_maintains_performance(
        self, session: Session, large_dataset
    ):
        """Test pagination performance is consistent across pages."""
        # Arrange
        user_id = large_dataset["user_id"]
        page_times = []

        # Act - Test first, middle, and last pages
        for page in [1, 15, 30]:
            query_params = TaskQueryParams(page=page, limit=50)
            start_time = time.time()
            tasks, metadata = TaskService.get_tasks(session, user_id, query_params)
            end_time = time.time()
            page_times.append((end_time - start_time) * 1000)

        # Assert - All pages should be fast
        for idx, page_time in enumerate(page_times):
            assert page_time < 500, f"Page {[1, 15, 30][idx]} took {page_time}ms, expected < 500ms"

        # Performance should be relatively consistent across pages
        max_time = max(page_times)
        min_time = min(page_times)
        # Max time should not be more than 3x min time
        assert max_time < min_time * 3, "Pagination performance varies too much across pages"

    def test_count_query_completes_under_200ms(self, session: Session, large_dataset):
        """Test counting tasks completes within 200ms."""
        # Arrange
        user_id = large_dataset["user_id"]

        # Act
        start_time = time.time()
        stats = TaskService.get_task_statistics(session, user_id)
        end_time = time.time()

        # Assert
        execution_time = (end_time - start_time) * 1000
        assert (
            execution_time < 200
        ), f"Statistics query took {execution_time}ms, expected < 200ms"
        assert stats["total"] == 1500

    def test_get_task_by_id_completes_under_100ms(self, session: Session, large_dataset):
        """Test retrieving single task by ID completes within 100ms."""
        # Arrange
        user_id = large_dataset["user_id"]
        # Get a task ID from the middle of the dataset
        from sqlmodel import select

        task = session.exec(
            select(Task).where(Task.user_id == user_id).offset(750).limit(1)
        ).first()

        # Act
        start_time = time.time()
        retrieved_task = TaskService.get_task_by_id(session, user_id, task.id)
        end_time = time.time()

        # Assert
        execution_time = (end_time - start_time) * 1000
        assert (
            execution_time < 100
        ), f"Get by ID took {execution_time}ms, expected < 100ms"
        assert retrieved_task.id == task.id


class TestBulkOperationPerformance:
    """Tests for bulk operation performance."""

    def test_bulk_delete_100_tasks_completes_under_1000ms(
        self, session: Session, large_dataset
    ):
        """Test bulk deleting 100 tasks completes within 1 second."""
        # Arrange
        user_id = large_dataset["user_id"]
        from sqlmodel import select

        tasks = session.exec(select(Task).where(Task.user_id == user_id).limit(100)).all()
        task_ids = [task.id for task in tasks]

        # Act
        start_time = time.time()
        result = TaskService.bulk_operations(session, user_id, "delete", task_ids)
        end_time = time.time()

        # Assert
        execution_time = (end_time - start_time) * 1000
        assert (
            execution_time < 1000
        ), f"Bulk delete took {execution_time}ms, expected < 1000ms"
        assert result["success"] == 100

    def test_bulk_update_100_tasks_completes_under_1000ms(
        self, session: Session, large_dataset
    ):
        """Test bulk updating 100 tasks completes within 1 second."""
        # Arrange
        user_id = large_dataset["user_id"]
        from sqlmodel import select

        tasks = session.exec(select(Task).where(Task.user_id == user_id).limit(100)).all()
        task_ids = [task.id for task in tasks]

        # Act
        start_time = time.time()
        result = TaskService.bulk_operations(session, user_id, "complete", task_ids)
        end_time = time.time()

        # Assert
        execution_time = (end_time - start_time) * 1000
        assert (
            execution_time < 1000
        ), f"Bulk update took {execution_time}ms, expected < 1000ms"
        assert result["success"] == 100


class TestExportPerformance:
    """Tests for export operation performance."""

    def test_export_1000_tasks_csv_completes_under_2000ms(
        self, session: Session, large_dataset
    ):
        """Test exporting 1000 tasks to CSV completes within 2 seconds."""
        # Arrange
        user_id = large_dataset["user_id"]
        # Get tasks in batches (limit is 100, so we need to get all tasks)
        all_tasks = []
        page = 1
        while True:
            tasks, metadata = TaskService.get_tasks(
                session, user_id, TaskQueryParams(page=page, limit=100)
            )
            all_tasks.extend(tasks)
            if len(tasks) < 100:
                break
            page += 1
        tasks = all_tasks[:1000]  # Limit to 1000 for export test

        from services.export_import_service import ExportImportService

        # Act
        start_time = time.time()
        csv_content = ExportImportService.export_tasks_csv(tasks)
        end_time = time.time()

        # Assert
        execution_time = (end_time - start_time) * 1000
        assert execution_time < 2000, f"CSV export took {execution_time}ms, expected < 2000ms"
        assert len(csv_content) > 0

    def test_export_1000_tasks_json_completes_under_2000ms(
        self, session: Session, large_dataset
    ):
        """Test exporting 1000 tasks to JSON completes within 2 seconds."""
        # Arrange
        user_id = large_dataset["user_id"]
        # Get tasks in batches (limit is 100, so we need to get all tasks)
        all_tasks = []
        page = 1
        while True:
            tasks, metadata = TaskService.get_tasks(
                session, user_id, TaskQueryParams(page=page, limit=100)
            )
            all_tasks.extend(tasks)
            if len(tasks) < 100:
                break
            page += 1
        tasks = all_tasks[:1000]  # Limit to 1000 for export test

        from services.export_import_service import ExportImportService

        # Act
        start_time = time.time()
        json_content = ExportImportService.export_tasks_json(tasks)
        end_time = time.time()

        # Assert
        execution_time = (end_time - start_time) * 1000
        assert execution_time < 2000, f"JSON export took {execution_time}ms, expected < 2000ms"
        assert len(json_content) > 0


class TestIndexEffectiveness:
    """Tests to verify database indexes are effective."""

    def test_query_with_user_id_filter_uses_index(self, session: Session, large_dataset):
        """Test querying by user_id is fast (should use index)."""
        # Arrange
        user_id = large_dataset["user_id"]

        # Act
        start_time = time.time()
        tasks, _ = TaskService.get_tasks(session, user_id, TaskQueryParams(page=1, limit=50))
        end_time = time.time()

        # Assert
        execution_time = (end_time - start_time) * 1000
        # Should be very fast with index
        assert execution_time < 100, f"User ID filter took {execution_time}ms, expected < 100ms"

    def test_query_with_completed_filter_uses_index(self, session: Session, large_dataset):
        """Test querying by completed status is fast (should use index)."""
        # Arrange
        user_id = large_dataset["user_id"]
        query_params = TaskQueryParams(status="completed")

        # Act
        start_time = time.time()
        tasks, _ = TaskService.get_tasks(session, user_id, query_params)
        end_time = time.time()

        # Assert
        execution_time = (end_time - start_time) * 1000
        # Should be fast with index
        assert (
            execution_time < 300
        ), f"Completed filter took {execution_time}ms, expected < 300ms"

    def test_query_with_priority_filter_uses_index(self, session: Session, large_dataset):
        """Test querying by priority is fast (should use index)."""
        # Arrange
        user_id = large_dataset["user_id"]
        query_params = TaskQueryParams(priority="high")

        # Act
        start_time = time.time()
        tasks, _ = TaskService.get_tasks(session, user_id, query_params)
        end_time = time.time()

        # Assert
        execution_time = (end_time - start_time) * 1000
        # Should be fast with index
        assert (
            execution_time < 300
        ), f"Priority filter took {execution_time}ms, expected < 300ms"
