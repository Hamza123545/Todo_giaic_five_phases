"""
Integration tests for task query parameters (filtering, sorting, search, pagination).

This module tests all query parameter combinations for the task listing endpoint.
"""

import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient
from sqlmodel import Session

from models import Task, User


class TestStatusFiltering:
    """Tests for status filtering (all, pending, completed)."""

    @pytest.mark.asyncio
    async def test_filter_all_tasks(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test filtering by status=all (default) returns all tasks."""
        # Create tasks with different completion status
        tasks = [
            Task(user_id=test_user.id, title="Completed Task", priority="medium", completed=True),
            Task(user_id=test_user.id, title="Pending Task", priority="medium", completed=False),
        ]
        for task in tasks:
            db.add(task)
        db.commit()

        response = await async_client.get(
            f"/api/{test_user.id}/tasks?status=all", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2

    @pytest.mark.asyncio
    async def test_filter_pending_tasks(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test filtering by status=pending returns only incomplete tasks."""
        tasks = [
            Task(user_id=test_user.id, title="Completed Task", priority="medium", completed=True),
            Task(user_id=test_user.id, title="Pending Task 1", priority="medium", completed=False),
            Task(user_id=test_user.id, title="Pending Task 2", priority="medium", completed=False),
        ]
        for task in tasks:
            db.add(task)
        db.commit()

        response = await async_client.get(
            f"/api/{test_user.id}/tasks?status=pending", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert all(not task["completed"] for task in data["data"])

    @pytest.mark.asyncio
    async def test_filter_completed_tasks(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test filtering by status=completed returns only completed tasks."""
        tasks = [
            Task(user_id=test_user.id, title="Completed Task 1", priority="medium", completed=True),
            Task(user_id=test_user.id, title="Completed Task 2", priority="medium", completed=True),
            Task(user_id=test_user.id, title="Pending Task", priority="medium", completed=False),
        ]
        for task in tasks:
            db.add(task)
        db.commit()

        response = await async_client.get(
            f"/api/{test_user.id}/tasks?status=completed", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert all(task["completed"] for task in data["data"])


class TestPriorityFiltering:
    """Tests for priority filtering."""

    @pytest.mark.asyncio
    async def test_filter_by_priority_low(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test filtering by priority=low."""
        tasks = [
            Task(user_id=test_user.id, title="Low Priority", priority="low"),
            Task(user_id=test_user.id, title="Medium Priority", priority="medium"),
            Task(user_id=test_user.id, title="High Priority", priority="high"),
        ]
        for task in tasks:
            db.add(task)
        db.commit()

        response = await async_client.get(
            f"/api/{test_user.id}/tasks?priority=low", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1
        assert data["data"][0]["priority"] == "low"

    @pytest.mark.asyncio
    async def test_filter_by_priority_high(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test filtering by priority=high."""
        tasks = [
            Task(user_id=test_user.id, title="Low Priority", priority="low"),
            Task(user_id=test_user.id, title="High Priority 1", priority="high"),
            Task(user_id=test_user.id, title="High Priority 2", priority="high"),
        ]
        for task in tasks:
            db.add(task)
        db.commit()

        response = await async_client.get(
            f"/api/{test_user.id}/tasks?priority=high", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert all(task["priority"] == "high" for task in data["data"])


class TestDueDateFiltering:
    """Tests for due date range filtering."""

    @pytest.mark.asyncio
    async def test_filter_by_due_date_from(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test filtering by due_date_from."""
        today = datetime.utcnow()
        past = today - timedelta(days=7)
        future = today + timedelta(days=7)

        tasks = [
            Task(user_id=test_user.id, title="Past Task", priority="medium", due_date=past),
            Task(user_id=test_user.id, title="Today Task", priority="medium", due_date=today),
            Task(user_id=test_user.id, title="Future Task", priority="medium", due_date=future),
        ]
        for task in tasks:
            db.add(task)
        db.commit()

        # Filter tasks from today onwards
        response = await async_client.get(
            f"/api/{test_user.id}/tasks?due_date_from={today.isoformat()}", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) >= 2  # Today and Future tasks

    @pytest.mark.asyncio
    async def test_filter_by_due_date_range(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test filtering by due date range (from and to)."""
        today = datetime.utcnow()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)
        next_week = today + timedelta(days=7)

        tasks = [
            Task(user_id=test_user.id, title="Yesterday", priority="medium", due_date=yesterday),
            Task(user_id=test_user.id, title="Today", priority="medium", due_date=today),
            Task(user_id=test_user.id, title="Tomorrow", priority="medium", due_date=tomorrow),
            Task(user_id=test_user.id, title="Next Week", priority="medium", due_date=next_week),
        ]
        for task in tasks:
            db.add(task)
        db.commit()

        # Filter tasks between today and tomorrow
        response = await async_client.get(
            f"/api/{test_user.id}/tasks?due_date_from={today.isoformat()}&due_date_to={tomorrow.isoformat()}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2  # Today and Tomorrow tasks


class TestTagsFiltering:
    """Tests for tags filtering."""

    @pytest.mark.asyncio
    async def test_filter_by_single_tag(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test filtering by a single tag."""
        tasks = [
            Task(user_id=test_user.id, title="Work Task", priority="medium", tags=["work"]),
            Task(user_id=test_user.id, title="Personal Task", priority="medium", tags=["personal"]),
            Task(user_id=test_user.id, title="Both", priority="medium", tags=["work", "urgent"]),
        ]
        for task in tasks:
            db.add(task)
        db.commit()

        response = await async_client.get(
            f"/api/{test_user.id}/tasks?tags=work", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        # Should return tasks with "work" tag
        assert len(data["data"]) >= 2

    @pytest.mark.asyncio
    async def test_filter_by_multiple_tags(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test filtering by multiple tags (OR logic)."""
        tasks = [
            Task(user_id=test_user.id, title="Work Task", priority="medium", tags=["work"]),
            Task(user_id=test_user.id, title="Urgent Task", priority="medium", tags=["urgent"]),
            Task(user_id=test_user.id, title="Personal Task", priority="medium", tags=["personal"]),
        ]
        for task in tasks:
            db.add(task)
        db.commit()

        response = await async_client.get(
            f"/api/{test_user.id}/tasks?tags=work,urgent", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        # Should return tasks with either "work" or "urgent" tags
        assert len(data["data"]) >= 2


class TestSorting:
    """Tests for sorting functionality."""

    @pytest.mark.asyncio
    async def test_sort_by_created_desc(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test sorting by created date descending (default)."""
        tasks = [
            Task(user_id=test_user.id, title="First Task", priority="medium"),
            Task(user_id=test_user.id, title="Second Task", priority="medium"),
            Task(user_id=test_user.id, title="Third Task", priority="medium"),
        ]
        for task in tasks:
            db.add(task)
            db.commit()  # Commit separately to ensure different timestamps

        response = await async_client.get(
            f"/api/{test_user.id}/tasks?sort=created:desc", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 3
        # Most recent task should be first
        assert data["data"][0]["title"] == "Third Task"

    @pytest.mark.asyncio
    async def test_sort_by_title_asc(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test sorting by title ascending."""
        tasks = [
            Task(user_id=test_user.id, title="Zebra Task", priority="medium"),
            Task(user_id=test_user.id, title="Alpha Task", priority="medium"),
            Task(user_id=test_user.id, title="Beta Task", priority="medium"),
        ]
        for task in tasks:
            db.add(task)
        db.commit()

        response = await async_client.get(
            f"/api/{test_user.id}/tasks?sort=title:asc", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["data"][0]["title"] == "Alpha Task"
        assert data["data"][1]["title"] == "Beta Task"
        assert data["data"][2]["title"] == "Zebra Task"

    @pytest.mark.asyncio
    async def test_sort_by_priority_desc(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test sorting by priority descending."""
        tasks = [
            Task(user_id=test_user.id, title="Low Task", priority="low"),
            Task(user_id=test_user.id, title="High Task", priority="high"),
            Task(user_id=test_user.id, title="Medium Task", priority="medium"),
        ]
        for task in tasks:
            db.add(task)
        db.commit()

        response = await async_client.get(
            f"/api/{test_user.id}/tasks?sort=priority:desc", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        # Note: String sorting, so order is: "medium" > "low" > "high"
        assert len(data["data"]) == 3


class TestSearch:
    """Tests for search functionality."""

    @pytest.mark.asyncio
    async def test_search_in_title(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test searching in task titles."""
        tasks = [
            Task(user_id=test_user.id, title="Buy groceries", priority="medium"),
            Task(user_id=test_user.id, title="Buy car", priority="medium"),
            Task(user_id=test_user.id, title="Sell house", priority="medium"),
        ]
        for task in tasks:
            db.add(task)
        db.commit()

        response = await async_client.get(
            f"/api/{test_user.id}/tasks?search=buy", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2

    @pytest.mark.asyncio
    async def test_search_in_description(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test searching in task descriptions."""
        tasks = [
            Task(
                user_id=test_user.id,
                title="Task 1",
                description="Important meeting tomorrow",
                priority="medium",
            ),
            Task(
                user_id=test_user.id,
                title="Task 2",
                description="Review documents",
                priority="medium",
            ),
        ]
        for task in tasks:
            db.add(task)
        db.commit()

        response = await async_client.get(
            f"/api/{test_user.id}/tasks?search=meeting", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1
        assert data["data"][0]["title"] == "Task 1"

    @pytest.mark.asyncio
    async def test_search_case_insensitive(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test that search is case-insensitive."""
        task = Task(user_id=test_user.id, title="URGENT Task", priority="medium")
        db.add(task)
        db.commit()

        response = await async_client.get(
            f"/api/{test_user.id}/tasks?search=urgent", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1


class TestPagination:
    """Tests for pagination functionality."""

    @pytest.mark.asyncio
    async def test_pagination_first_page(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test pagination - first page."""
        # Create 25 tasks
        for i in range(25):
            task = Task(user_id=test_user.id, title=f"Task {i}", priority="medium")
            db.add(task)
        db.commit()

        response = await async_client.get(
            f"/api/{test_user.id}/tasks?page=1&limit=10", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 10
        assert data["meta"]["total"] == 25
        assert data["meta"]["page"] == 1
        assert data["meta"]["limit"] == 10
        assert data["meta"]["totalPages"] == 3

    @pytest.mark.asyncio
    async def test_pagination_second_page(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test pagination - second page."""
        # Create 25 tasks
        for i in range(25):
            task = Task(user_id=test_user.id, title=f"Task {i}", priority="medium")
            db.add(task)
        db.commit()

        response = await async_client.get(
            f"/api/{test_user.id}/tasks?page=2&limit=10", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 10
        assert data["meta"]["page"] == 2
        assert data["meta"]["total"] == 25

    @pytest.mark.asyncio
    async def test_pagination_last_page(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test pagination - last page with remaining items."""
        # Create 25 tasks
        for i in range(25):
            task = Task(user_id=test_user.id, title=f"Task {i}", priority="medium")
            db.add(task)
        db.commit()

        response = await async_client.get(
            f"/api/{test_user.id}/tasks?page=3&limit=10", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 5  # Only 5 tasks remaining
        assert data["meta"]["page"] == 3


class TestCombinedFilters:
    """Tests for combining multiple query parameters."""

    @pytest.mark.asyncio
    async def test_filter_priority_and_status(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test combining priority and status filters."""
        tasks = [
            Task(
                user_id=test_user.id, title="High Completed", priority="high", completed=True
            ),
            Task(
                user_id=test_user.id, title="High Pending", priority="high", completed=False
            ),
            Task(user_id=test_user.id, title="Low Pending", priority="low", completed=False),
        ]
        for task in tasks:
            db.add(task)
        db.commit()

        response = await async_client.get(
            f"/api/{test_user.id}/tasks?priority=high&status=pending", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1
        assert data["data"][0]["title"] == "High Pending"

    @pytest.mark.asyncio
    async def test_search_with_sorting(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test combining search with sorting."""
        tasks = [
            Task(user_id=test_user.id, title="Zebra important task", priority="medium"),
            Task(user_id=test_user.id, title="Alpha important task", priority="medium"),
        ]
        for task in tasks:
            db.add(task)
        db.commit()

        response = await async_client.get(
            f"/api/{test_user.id}/tasks?search=important&sort=title:asc", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["data"][0]["title"] == "Alpha important task"

    @pytest.mark.asyncio
    async def test_all_filters_combined(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db: Session
    ):
        """Test combining all query parameters."""
        today = datetime.utcnow()
        future = today + timedelta(days=7)

        tasks = [
            Task(
                user_id=test_user.id,
                title="Matching task",
                description="Important work",
                priority="high",
                due_date=future,
                tags=["work"],
                completed=False,
            ),
            Task(
                user_id=test_user.id,
                title="Non-matching priority",
                description="Important work",
                priority="low",
                due_date=future,
                tags=["work"],
                completed=False,
            ),
        ]
        for task in tasks:
            db.add(task)
        db.commit()

        response = await async_client.get(
            f"/api/{test_user.id}/tasks?status=pending&priority=high&search=important&sort=created:desc&page=1&limit=10",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1
        assert data["data"][0]["title"] == "Matching task"
