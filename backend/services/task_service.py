"""
Task service for managing task-related business logic.

This module provides business logic for task CRUD operations with user isolation.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlmodel import Session, select, func

from models import Task


class TaskService:
    """Service for task-related business logic with user isolation."""

    def create_task(
        self,
        db: Session,
        user_id: UUID,
        title: str,
        description: Optional[str] = None,
        priority: str = "medium",
        due_date: Optional[datetime] = None,
        tags: Optional[List[str]] = None,
    ) -> Task:
        """
        Create a new task for the specified user.

        Args:
            db: Database session
            user_id: Owner of the task
            title: Task title (max 200 characters)
            description: Task description (optional, max 1000 characters)
            priority: Task priority level (low|medium|high, default medium)
            due_date: Due date for task completion (optional)
            tags: Tags for task categorization (optional array)

        Returns:
            Task: Created task object

        Raises:
            ValueError: If validation fails
        """
        # Validate inputs
        if not title or len(title.strip()) == 0:
            raise ValueError("Title is required")

        if len(title.strip()) > 200:
            raise ValueError("Title must be 200 characters or less")

        if description and len(description) > 1000:
            raise ValueError("Description must be 1000 characters or less")

        if priority not in ["low", "medium", "high"]:
            raise ValueError("Priority must be one of: low, medium, high")

        if due_date and due_date < datetime.utcnow():
            raise ValueError("Due date cannot be in the past")

        # Create task
        task = Task(
            user_id=user_id,
            title=title.strip(),
            description=description,
            priority=priority,
            due_date=due_date,
            tags=tags if tags else [],
            completed=False,
        )

        db.add(task)
        db.commit()
        db.refresh(task)

        return task

    def get_tasks(
        self,
        db: Session,
        user_id: UUID,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        due_date: Optional[str] = None,
        tags: Optional[str] = None,
        search: Optional[str] = None,
        sort: Optional[str] = "created",
        sort_direction: Optional[str] = "desc",
        page: int = 1,
        limit: int = 20,
    ) -> tuple[List[Task], int]:
        """
        Get all tasks for the specified user with comprehensive filtering, sorting, and pagination.

        Args:
            db: Database session
            user_id: User ID to filter tasks for
            status: Filter by status (all|pending|completed, default: all)
            priority: Filter by priority level (low|medium|high, optional)
            due_date: Filter by due date (YYYY-MM-DD format, optional)
            tags: Filter by tags (comma-separated string, optional)
            search: Search in title and description (optional)
            sort: Sort by field (created|title|updated|priority|due_date, default: created)
            sort_direction: Sort direction (asc|desc, default: desc)
            page: Page number (default: 1)
            limit: Number of tasks per page (default: 20)

        Returns:
            tuple: (List of tasks, total count)
        """
        # Base query with user isolation
        statement = select(Task).where(Task.user_id == user_id)

        # Apply status filter
        if status and status.lower() != "all":
            if status.lower() == "pending":
                statement = statement.where(Task.completed == False)
            elif status.lower() == "completed":
                statement = statement.where(Task.completed == True)

        # Apply priority filter
        if priority is not None:
            statement = statement.where(Task.priority == priority)

        # Apply due_date filter
        if due_date is not None:
            from datetime import datetime
            try:
                due_date_obj = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                statement = statement.where(Task.due_date == due_date_obj)
            except ValueError:
                # Invalid date format, ignore filter
                pass

        # Apply tags filter (tags stored as JSON array)
        if tags is not None:
            tag_list = tags.split(',')
            for tag in tag_list:
                tag = tag.strip()
                if tag:
                    # Using JSON operators to check if tag exists in tags array
                    statement = statement.where(Task.tags.any(tag))

        # Apply search filter (across title and description)
        if search is not None and search.strip():
            search_term = f"%{search.strip()}%"
            from sqlalchemy import or_
            statement = statement.where(
                or_(
                    Task.title.ilike(search_term),
                    Task.description.ilike(search_term)
                )
            )

        # Count total before applying limits
        count_statement = select(func.count()).select_from(statement.subquery())
        total_count = db.exec(count_statement).one()

        # Apply sorting
        if sort == "title":
            if sort_direction == "asc":
                statement = statement.order_by(Task.title.asc())
            else:
                statement = statement.order_by(Task.title.desc())
        elif sort == "updated":
            if sort_direction == "asc":
                statement = statement.order_by(Task.updated_at.asc())
            else:
                statement = statement.order_by(Task.updated_at.desc())
        elif sort == "priority":
            from sqlalchemy import case
            priority_order = case(
                (Task.priority == "high", 1),
                (Task.priority == "medium", 2),
                (Task.priority == "low", 3)
            )
            if sort_direction == "asc":
                statement = statement.order_by(priority_order.asc())
            else:
                statement = statement.order_by(priority_order.desc())
        elif sort == "due_date":
            if sort_direction == "asc":
                statement = statement.order_by(Task.due_date.asc().nulls_last())
            else:
                statement = statement.order_by(Task.due_date.desc().nulls_last())
        else:  # Default to created_at
            if sort_direction == "asc":
                statement = statement.order_by(Task.created_at.asc())
            else:
                statement = statement.order_by(Task.created_at.desc())

        # Apply pagination
        offset = (page - 1) * limit
        statement = statement.offset(offset).limit(limit)

        tasks = db.exec(statement).all()
        return tasks, total_count

    def get_task_by_id(self, db: Session, user_id: UUID, task_id: int) -> Optional[Task]:
        """
        Get a specific task by ID for the specified user.

        Args:
            db: Database session
            user_id: User ID (for isolation)
            task_id: Task ID to retrieve

        Returns:
            Task if found and belongs to user, None otherwise
        """
        statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
        return db.exec(statement).first()

    def update_task(
        self,
        db: Session,
        user_id: UUID,
        task_id: int,
        title: Optional[str] = None,
        description: Optional[str] = None,
        priority: Optional[str] = None,
        due_date: Optional[datetime] = None,
        tags: Optional[List[str]] = None,
        completed: Optional[bool] = None,
    ) -> Optional[Task]:
        """
        Update a task for the specified user.

        Args:
            db: Database session
            user_id: User ID (for isolation)
            task_id: Task ID to update
            title: New title (optional)
            description: New description (optional)
            priority: New priority (optional)
            due_date: New due date (optional)
            tags: New tags (optional)
            completed: New completion status (optional)

        Returns:
            Updated Task if successful, None if task not found or doesn't belong to user

        Raises:
            ValueError: If validation fails
        """
        task = self.get_task_by_id(db, user_id, task_id)
        if not task:
            return None

        # Validate inputs if provided
        if title is not None:
            if not title or len(title.strip()) == 0:
                raise ValueError("Title is required")

            if len(title.strip()) > 200:
                raise ValueError("Title must be 200 characters or less")

            task.title = title.strip()

        if description is not None:
            if len(description) > 1000:
                raise ValueError("Description must be 1000 characters or less")
            task.description = description

        if priority is not None:
            if priority not in ["low", "medium", "high"]:
                raise ValueError("Priority must be one of: low, medium, high")
            task.priority = priority

        if due_date is not None:
            if due_date < datetime.utcnow():
                raise ValueError("Due date cannot be in the past")
            task.due_date = due_date

        if tags is not None:
            task.tags = tags

        if completed is not None:
            task.completed = completed

        db.add(task)
        db.commit()
        db.refresh(task)

        return task

    def delete_task(self, db: Session, user_id: UUID, task_id: int) -> bool:
        """
        Delete a task for the specified user.

        Args:
            db: Database session
            user_id: User ID (for isolation)
            task_id: Task ID to delete

        Returns:
            bool: True if task was deleted, False if not found or doesn't belong to user
        """
        task = self.get_task_by_id(db, user_id, task_id)
        if not task:
            return False

        db.delete(task)
        db.commit()
        return True

    def toggle_complete(self, db: Session, user_id: UUID, task_id: int, completed: bool) -> Optional[Task]:
        """
        Toggle completion status of a task for the specified user.

        Args:
            db: Database session
            user_id: User ID (for isolation)
            task_id: Task ID to update
            completed: New completion status

        Returns:
            Updated Task if successful, None if task not found or doesn't belong to user
        """
        task = self.get_task_by_id(db, user_id, task_id)
        if not task:
            return None

        task.completed = completed
        db.add(task)
        db.commit()
        db.refresh(task)

        return task

    def get_tasks_count(self, db: Session, user_id: UUID) -> int:
        """
        Get total count of tasks for the specified user.

        Args:
            db: Database session
            user_id: User ID to count tasks for

        Returns:
            int: Total number of tasks
        """
        statement = select(Task).where(Task.user_id == user_id)
        return len(db.exec(statement).all())

    def get_statistics(self, db: Session, user_id: UUID) -> dict:
        """
        Calculate task statistics for the specified user.

        Args:
            db: Database session
            user_id: User ID to calculate statistics for

        Returns:
            dict: Statistics with keys: total, completed, pending, overdue
        """
        # Get all tasks for user
        all_tasks_stmt = select(Task).where(Task.user_id == user_id)
        all_tasks = db.exec(all_tasks_stmt).all()

        total = len(all_tasks)
        completed = sum(1 for task in all_tasks if task.completed)
        pending = total - completed

        # Calculate overdue tasks (due_date < today AND completed = false)
        now = datetime.utcnow()
        overdue = sum(
            1 for task in all_tasks
            if task.due_date and task.due_date < now and not task.completed
        )

        return {
            'total': total,
            'completed': completed,
            'pending': pending,
            'overdue': overdue
        }

    def bulk_delete(self, db: Session, user_id: UUID, task_ids: List[int]) -> int:
        """
        Delete multiple tasks for the specified user with database transaction.

        Args:
            db: Database session
            user_id: User ID (for isolation)
            task_ids: List of task IDs to delete

        Returns:
            int: Number of tasks deleted

        Raises:
            Exception: If any task doesn't belong to user (transaction rolled back)
        """
        try:
            deleted_count = 0

            for task_id in task_ids:
                task = self.get_task_by_id(db, user_id, task_id)
                if not task:
                    raise Exception(f"Task {task_id} not found or doesn't belong to user")

                db.delete(task)
                deleted_count += 1

            db.commit()
            return deleted_count

        except Exception as e:
            db.rollback()
            raise e

    def bulk_complete(self, db: Session, user_id: UUID, task_ids: List[int]) -> int:
        """
        Mark multiple tasks as complete for the specified user with database transaction.

        Args:
            db: Database session
            user_id: User ID (for isolation)
            task_ids: List of task IDs to mark complete

        Returns:
            int: Number of tasks updated

        Raises:
            Exception: If any task doesn't belong to user (transaction rolled back)
        """
        try:
            updated_count = 0

            for task_id in task_ids:
                task = self.get_task_by_id(db, user_id, task_id)
                if not task:
                    raise Exception(f"Task {task_id} not found or doesn't belong to user")

                task.completed = True
                db.add(task)
                updated_count += 1

            db.commit()
            return updated_count

        except Exception as e:
            db.rollback()
            raise e

    def bulk_pending(self, db: Session, user_id: UUID, task_ids: List[int]) -> int:
        """
        Mark multiple tasks as pending for the specified user with database transaction.

        Args:
            db: Database session
            user_id: User ID (for isolation)
            task_ids: List of task IDs to mark pending

        Returns:
            int: Number of tasks updated

        Raises:
            Exception: If any task doesn't belong to user (transaction rolled back)
        """
        try:
            updated_count = 0

            for task_id in task_ids:
                task = self.get_task_by_id(db, user_id, task_id)
                if not task:
                    raise Exception(f"Task {task_id} not found or doesn't belong to user")

                task.completed = False
                db.add(task)
                updated_count += 1

            db.commit()
            return updated_count

        except Exception as e:
            db.rollback()
            raise e

    def bulk_priority_change(self, db: Session, user_id: UUID, task_ids: List[int], priority: str) -> int:
        """
        Change priority for multiple tasks with database transaction.

        Args:
            db: Database session
            user_id: User ID (for isolation)
            task_ids: List of task IDs to update
            priority: New priority level (low|medium|high)

        Returns:
            int: Number of tasks updated

        Raises:
            ValueError: If priority is invalid
            Exception: If any task doesn't belong to user (transaction rolled back)
        """
        if priority not in ['low', 'medium', 'high']:
            raise ValueError("Priority must be one of: low, medium, high")

        try:
            updated_count = 0

            for task_id in task_ids:
                task = self.get_task_by_id(db, user_id, task_id)
                if not task:
                    raise Exception(f"Task {task_id} not found or doesn't belong to user")

                task.priority = priority
                db.add(task)
                updated_count += 1

            db.commit()
            return updated_count

        except Exception as e:
            db.rollback()
            raise e