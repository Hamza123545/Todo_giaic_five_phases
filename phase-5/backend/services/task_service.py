"""
Task service layer for business logic.

This module provides the TaskService class for handling task-related operations.
"""

import math
from datetime import datetime
from typing import Optional
# Removed UUID import - Better Auth uses string IDs

from fastapi import HTTPException, status
from sqlmodel import Session, func, or_, select

from models import Task
from schemas.query_params import TaskQueryParams
from schemas.requests import CreateTaskRequest, UpdateTaskRequest


class TaskService:
    """
    Service class for task management operations.

    This class handles all business logic for tasks including:
    - Creating tasks
    - Retrieving tasks (all or by ID)
    - Updating task details
    - Deleting tasks
    - Toggling completion status
    """

    @staticmethod
    def create_task(db: Session, user_id: str, task_data: CreateTaskRequest) -> Task:
        """
        Create a new task for a user.

        Args:
            db: Database session
            user_id: User ID from JWT token (enforces user isolation)
            task_data: Task creation data

        Returns:
            Task: Created task

        Raises:
            HTTPException: 400 if validation fails
        """
        # Create new task with user isolation
        new_task = Task(
            user_id=user_id,
            title=task_data.title,
            description=task_data.description,
            priority=task_data.priority or "medium",
            due_date=task_data.due_date,
            tags=task_data.tags,
            completed=False,
        )

        db.add(new_task)
        db.commit()
        db.refresh(new_task)

        return new_task

    @staticmethod
    def get_tasks(
        db: Session, user_id: str, query_params: Optional[TaskQueryParams] = None
    ) -> tuple[list[Task], dict]:
        """
        Get tasks for a user with filtering, sorting, search, and pagination.

        Args:
            db: Database session
            user_id: User ID from JWT token (enforces user isolation)
            query_params: Query parameters for filtering, sorting, search, and pagination

        Returns:
            tuple: (list of tasks, pagination metadata dict)
                metadata contains: total, page, limit, totalPages
        """
        # Start with base query filtering by user_id
        statement = select(Task).where(Task.user_id == user_id)

        # Apply filters if query_params provided
        if query_params:
            # Status filter (completed/pending)
            if query_params.status == "completed":
                statement = statement.where(Task.completed.is_(True))
            elif query_params.status == "pending":
                statement = statement.where(Task.completed.is_(False))
            # status == "all" shows all tasks (no filter needed)

            # Priority filter
            if query_params.priority:
                statement = statement.where(Task.priority == query_params.priority)

            # Due date range filter
            if query_params.due_date_from:
                statement = statement.where(Task.due_date >= query_params.due_date_from)
            if query_params.due_date_to:
                statement = statement.where(Task.due_date <= query_params.due_date_to)

            # Tags filter (tasks that have ANY of the specified tags)
            if query_params.tags:
                # PostgreSQL JSON operators for array containment
                # Check if task's tags array contains any of the specified tags
                tag_conditions = []
                for tag in query_params.tags:
                    # Use PostgreSQL's jsonb_array_elements_text to check array membership
                    # This checks if the tag exists in the tags JSON array
                    tag_conditions.append(func.jsonb_array_elements_text(Task.tags).contains(tag))
                if tag_conditions:
                    statement = statement.where(or_(*tag_conditions))

            # Search filter (full-text search in title and description)
            if query_params.search:
                search_term = f"%{query_params.search}%"
                statement = statement.where(
                    or_(
                        Task.title.ilike(search_term),
                        Task.description.ilike(search_term),
                    )
                )

        # Get total count BEFORE pagination
        count_statement = select(func.count()).select_from(statement.subquery())
        total_count = db.exec(count_statement).one()

        # Apply sorting
        if query_params and query_params.sort:
            # Parse sort parameter (format: "field:direction")
            if ":" in query_params.sort:
                field, direction = query_params.sort.split(":", 1)
            else:
                # Default to created:desc if format is invalid
                field, direction = "created", "desc"
            
            # Map field names to model attributes
            field_mapping = {
                "created": Task.created_at,
                "updated": Task.updated_at,
                "title": Task.title,
                "priority": Task.priority,
                "due_date": Task.due_date,
            }
            
            sort_field = field_mapping.get(field, Task.created_at)
            
            if direction == "desc":
                statement = statement.order_by(sort_field.desc())
            else:
                statement = statement.order_by(sort_field.asc())
        else:
            # Default sort: created date descending
            statement = statement.order_by(Task.created_at.desc())

        # Apply pagination
        page = query_params.page if query_params else 1
        limit = query_params.limit if query_params else 50
        offset = (page - 1) * limit

        statement = statement.offset(offset).limit(limit)

        # Execute query
        tasks = db.exec(statement).all()

        # Calculate pagination metadata
        total_pages = math.ceil(total_count / limit) if total_count > 0 else 1
        metadata = {
            "total": total_count,
            "page": page,
            "limit": limit,
            "totalPages": total_pages,
        }

        return list(tasks), metadata

    @staticmethod
    def get_task_by_id(db: Session, user_id: str, task_id: int) -> Task:
        """
        Get a specific task by ID.

        Args:
            db: Database session
            user_id: User ID from JWT token (enforces user isolation)
            task_id: Task ID to retrieve

        Returns:
            Task: Retrieved task

        Raises:
            HTTPException: 404 if task not found or doesn't belong to user
        """
        # Filter by both task_id and user_id to enforce user isolation
        statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
        task = db.exec(statement).first()

        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": f"Task with ID {task_id} not found or you don't have permission to access it",
                    },
                },
            )

        return task

    @staticmethod
    def update_task(db: Session, user_id: str, task_id: int, task_data: UpdateTaskRequest) -> Task:
        """
        Update a task's details.

        Args:
            db: Database session
            user_id: User ID from JWT token (enforces user isolation)
            task_id: Task ID to update
            task_data: Updated task data

        Returns:
            Task: Updated task

        Raises:
            HTTPException: 404 if task not found or doesn't belong to user
        """
        # Get task with user isolation verification
        task = TaskService.get_task_by_id(db, user_id, task_id)

        # Update only provided fields (exclude_unset=True excludes unset fields, exclude_none=True excludes None values)
        update_data = task_data.model_dump(exclude_unset=True, exclude_none=True)
        for field, value in update_data.items():
            setattr(task, field, value)

        # Update timestamp
        task.updated_at = datetime.utcnow()

        db.add(task)
        db.commit()
        db.refresh(task)

        return task

    @staticmethod
    def delete_task(db: Session, user_id: str, task_id: int) -> None:
        """
        Delete a task.

        Args:
            db: Database session
            user_id: User ID from JWT token (enforces user isolation)
            task_id: Task ID to delete

        Raises:
            HTTPException: 404 if task not found or doesn't belong to user
        """
        # Get task with user isolation verification
        task = TaskService.get_task_by_id(db, user_id, task_id)

        db.delete(task)
        db.commit()

    @staticmethod
    def toggle_complete(db: Session, user_id: str, task_id: int, completed: bool) -> Task:
        """
        Toggle task completion status.

        Args:
            db: Database session
            user_id: User ID from JWT token (enforces user isolation)
            task_id: Task ID to toggle
            completed: New completion status

        Returns:
            Task: Updated task

        Raises:
            HTTPException: 404 if task not found or doesn't belong to user
        """
        # Get task with user isolation verification
        task = TaskService.get_task_by_id(db, user_id, task_id)

        task.completed = completed
        task.updated_at = datetime.utcnow()

        db.add(task)
        db.commit()
        db.refresh(task)

        return task

    @staticmethod
    def get_task_statistics(db: Session, user_id: str) -> dict:
        """
        Get task statistics for a user.

        Args:
            db: Database session
            user_id: User ID from JWT token (enforces user isolation)

        Returns:
            dict: Statistics including total, completed, pending, and overdue tasks
        """
        from datetime import date

        # Total tasks
        total_statement = select(func.count(Task.id)).where(Task.user_id == user_id)
        total = db.exec(total_statement).one()

        # Completed tasks
        completed_statement = select(func.count(Task.id)).where(
            Task.user_id == user_id, Task.completed.is_(True)
        )
        completed = db.exec(completed_statement).one()

        # Pending tasks
        pending = total - completed

        # Overdue tasks (pending with due_date < today)
        today = date.today()
        overdue_statement = select(func.count(Task.id)).where(
            Task.user_id == user_id, Task.completed.is_(False), Task.due_date < today
        )
        overdue = db.exec(overdue_statement).one()

        # Priority breakdown
        priority_statement = (
            select(Task.priority, func.count(Task.id))
            .where(Task.user_id == user_id)
            .group_by(Task.priority)
        )
        priority_results = db.exec(priority_statement).all()
        priority_breakdown = {priority: count for priority, count in priority_results}

        return {
            "total": total,
            "completed": completed,
            "pending": pending,
            "overdue": overdue,
            "by_priority": {
                "low": priority_breakdown.get("low", 0),
                "medium": priority_breakdown.get("medium", 0),
                "high": priority_breakdown.get("high", 0),
            },
        }

    @staticmethod
    def bulk_operations(
        db: Session, user_id: str, operation: str, task_ids: list[int]
    ) -> dict:
        """
        Perform bulk operations on tasks.

        Args:
            db: Database session
            user_id: User ID from JWT token (enforces user isolation)
            operation: Operation to perform (delete, complete, pending, priority_low, priority_medium, priority_high)
            task_ids: List of task IDs to operate on

        Returns:
            dict: Results with success/failed counts and any error message

        Raises:
            HTTPException: 400 if operation is invalid
        """
        # Verify all tasks belong to user
        statement = select(Task).where(Task.id.in_(task_ids), Task.user_id == user_id)
        tasks = db.exec(statement).all()

        # Check if all tasks were found and belong to user
        found_task_ids = {task.id for task in tasks}
        missing_task_ids = set(task_ids) - found_task_ids

        if missing_task_ids:
            return {
                "success": len(tasks),
                "failed": len(missing_task_ids),
                "error": f"Tasks not found or don't belong to user: {list(missing_task_ids)}",
            }

        success = 0
        failed = 0

        try:
            for task in tasks:
                if operation == "delete":
                    db.delete(task)
                    success += 1
                elif operation == "complete":
                    task.completed = True
                    task.updated_at = datetime.utcnow()
                    success += 1
                elif operation == "pending":
                    task.completed = False
                    task.updated_at = datetime.utcnow()
                    success += 1
                elif operation == "priority_low":
                    task.priority = "low"
                    task.updated_at = datetime.utcnow()
                    success += 1
                elif operation == "priority_medium":
                    task.priority = "medium"
                    task.updated_at = datetime.utcnow()
                    success += 1
                elif operation == "priority_high":
                    task.priority = "high"
                    task.updated_at = datetime.utcnow()
                    success += 1
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail={
                            "success": False,
                            "error": {
                                "code": "VALIDATION_ERROR",
                                "message": f"Invalid operation: {operation}",
                            },
                        },
                    )

            db.commit()
            return {"success": success, "failed": failed}

        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            return {
                "success": 0,
                "failed": len(task_ids),
                "error": f"Bulk operation failed: {str(e)}",
            }
