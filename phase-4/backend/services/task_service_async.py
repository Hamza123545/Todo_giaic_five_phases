"""
Async task service layer for Phase III MCP tools.

This module provides async functions for task management,
shared by MCP tools and chat agent operations.

Note: This coexists with services/task_service.py (class-based sync)
      which is used by Phase 2 REST endpoints.
"""

from datetime import datetime
from typing import Dict, List, Optional

from fastapi import HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from models import Task


async def create_task(
    session: AsyncSession,
    user_id: str,
    title: str,
    description: Optional[str] = None,
    priority: Optional[str] = "medium",
    due_date: Optional[datetime] = None,
    tags: Optional[List[str]] = None
) -> Task:
    """
    Create a new task for the user.

    Args:
        session: Database session (injected)
        user_id: User's unique identifier
        title: Task title (required)
        description: Optional task description
        priority: Task priority (low|medium|high, default: medium)
        due_date: Optional due date
        tags: Optional list of tags

    Returns:
        Task: Created task instance

    Raises:
        HTTPException: 400 if validation fails
    """
    # Validate title
    if not title or not title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task title cannot be empty"
        )

    # Validate priority
    if priority not in ["low", "medium", "high"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid priority: {priority}. Must be 'low', 'medium', or 'high'"
        )

    # Create task
    task = Task(
        user_id=user_id,
        title=title.strip(),
        description=description.strip() if description else None,
        priority=priority,
        due_date=due_date,
        tags=tags,
        completed=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    session.add(task)
    await session.commit()
    await session.refresh(task)

    return task


async def get_tasks(
    session: AsyncSession,
    user_id: str,
    status: str = "all",
    priority: Optional[str] = None,
    tags: Optional[List[str]] = None
) -> List[Task]:
    """
    Retrieve user's tasks with optional filters.

    Args:
        session: Database session (injected)
        user_id: User's unique identifier
        status: Filter by status ("all" | "pending" | "completed")
        priority: Optional priority filter (low|medium|high)
        tags: Optional tag filter (tasks matching any tag)

    Returns:
        List[Task]: Filtered task instances ordered by created_at

    Raises:
        HTTPException: 400 if invalid status or priority
    """
    # Validate status
    if status not in ["all", "pending", "completed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status: {status}. Must be 'all', 'pending', or 'completed'"
        )

    # Build query
    query = select(Task).where(Task.user_id == user_id)

    # Apply status filter
    if status == "completed":
        query = query.where(Task.completed.is_(True))
    elif status == "pending":
        query = query.where(Task.completed.is_(False))
    # status == "all" shows all tasks (no filter needed)

    # Apply priority filter
    if priority:
        if priority not in ["low", "medium", "high"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid priority: {priority}"
            )
        query = query.where(Task.priority == priority)

    # Apply tag filter (tasks matching any provided tag)
    if tags:
        # SQLModel/SQLAlchemy JSON contains for array overlap
        from sqlalchemy import or_
        tag_conditions = [Task.tags.contains([tag]) for tag in tags]
        query = query.where(or_(*tag_conditions))

    # Order by created_at (newest first)
    query = query.order_by(Task.created_at.desc())

    # Execute query
    result = await session.execute(query)
    tasks = result.scalars().all()

    return list(tasks)


async def get_task_by_id(
    session: AsyncSession,
    user_id: str,
    task_id: int
) -> Task:
    """
    Retrieve a specific task by ID.

    Args:
        session: Database session (injected)
        user_id: User's unique identifier (for user isolation)
        task_id: Task ID

    Returns:
        Task: Task instance

    Raises:
        HTTPException: 404 if task not found or access denied
    """
    result = await session.execute(
        select(Task).where(
            Task.id == task_id,
            Task.user_id == user_id
        )
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found or access denied"
        )

    return task


async def update_task_status(
    session: AsyncSession,
    user_id: str,
    task_id: int,
    completed: bool
) -> Task:
    """
    Update task completion status.

    Args:
        session: Database session (injected)
        user_id: User's unique identifier
        task_id: Task ID
        completed: New completion status

    Returns:
        Task: Updated task instance

    Raises:
        HTTPException: 404 if task not found or access denied
    """
    # Fetch task with user isolation
    task = await get_task_by_id(session, user_id, task_id)

    # Update status
    task.completed = completed
    task.updated_at = datetime.utcnow()

    session.add(task)
    await session.commit()
    await session.refresh(task)

    return task


async def delete_task(
    session: AsyncSession,
    user_id: str,
    task_id: int
) -> bool:
    """
    Delete a task.

    Args:
        session: Database session (injected)
        user_id: User's unique identifier
        task_id: Task ID

    Returns:
        bool: True if deleted successfully

    Raises:
        HTTPException: 404 if task not found or access denied
    """
    # Fetch task with user isolation
    task = await get_task_by_id(session, user_id, task_id)

    # Delete task
    await session.delete(task)
    await session.commit()

    return True


async def update_task_details(
    session: AsyncSession,
    user_id: str,
    task_id: int,
    updates: Dict[str, any]
) -> Task:
    """
    Update task details (title, description, priority, due_date, tags).

    Args:
        session: Database session (injected)
        user_id: User's unique identifier
        task_id: Task ID
        updates: Dictionary of fields to update

    Returns:
        Task: Updated task instance

    Raises:
        HTTPException: 404 if task not found or access denied
        HTTPException: 400 if validation fails
    """
    # Fetch task with user isolation
    task = await get_task_by_id(session, user_id, task_id)

    # Apply updates
    if "title" in updates:
        title = updates["title"]
        if not title or not str(title).strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task title cannot be empty"
            )
        task.title = str(title).strip()

    if "description" in updates:
        desc = updates["description"]
        task.description = str(desc).strip() if desc else None

    if "priority" in updates:
        priority = updates["priority"]
        if priority not in ["low", "medium", "high"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid priority: {priority}"
            )
        task.priority = priority

    if "due_date" in updates:
        task.due_date = updates["due_date"]

    if "tags" in updates:
        tags = updates["tags"]
        task.tags = tags if isinstance(tags, list) else []

    # Update timestamp
    task.updated_at = datetime.utcnow()

    session.add(task)
    await session.commit()
    await session.refresh(task)

    return task
