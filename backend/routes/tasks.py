"""
Task management routes for CRUD operations.

This module defines API endpoints for task management with user isolation.
"""

from datetime import datetime
from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Path, Query, Request, UploadFile
from fastapi.responses import Response
from sqlmodel import Session

from db import get_session
from middleware.jwt import verify_jwt_token
from middleware.rate_limit import advanced_features_limiter
from models import Task
from schemas.requests import BulkOperationRequest, CreateTaskRequest, ToggleCompleteRequest, UpdateTaskRequest
from schemas.responses import (
    BulkOperationData,
    BulkOperationResponse,
    ErrorResponse,
    ImportResponse,
    ImportResult,
    StatisticsData,
    StatisticsResponse,
    SuccessResponse,
    TaskListResponse,
    TaskResponse,
)
from services.export_service import ExportService
from services.import_service import ImportService
from services.task_service import TaskService

router = APIRouter(prefix="/api/{user_id}", tags=["tasks"])


@router.post(
    "/tasks",
    response_model=TaskResponse,
    status_code=201,
    responses={
        201: {"description": "Task created successfully"},
        400: {"description": "Validation error", "model": ErrorResponse},
        401: {"description": "Unauthorized", "model": ErrorResponse},
        403: {"description": "Forbidden access", "model": ErrorResponse},
    },
)
async def create_task(
    user_id: UUID,
    request: CreateTaskRequest,
    current_user: Dict[str, Any] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> TaskResponse:
    """
    Create a new task for the authenticated user.

    Args:
        user_id: User ID from URL path
        request: Task creation request data
        current_user: Current authenticated user from JWT
        db: Database session

    Returns:
        TaskResponse: Created task data

    Raises:
        HTTPException: If validation fails or user not authorized
    """
    # Verify user_id from JWT matches URL path
    if str(current_user["id"]) != str(user_id):
        raise HTTPException(status_code=403, detail="User ID in token does not match URL path")

    try:
        task_service = TaskService()
        task = task_service.create_task(
            db=db,
            user_id=user_id,
            title=request.title,
            description=request.description,
            priority=request.priority,
            due_date=request.due_date,
            tags=request.tags,
        )
        return TaskResponse(
            id=task.id,
            user_id=task.user_id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            due_date=task.due_date,
            tags=task.tags if task.tags else [],
            completed=task.completed,
            created_at=task.created_at,
            updated_at=task.updated_at,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get(
    "/tasks",
    response_model=TaskListResponse,
    responses={
        200: {"description": "Tasks retrieved successfully"},
        400: {"description": "Invalid query parameters", "model": ErrorResponse},
        401: {"description": "Unauthorized", "model": ErrorResponse},
        403: {"description": "Forbidden access", "model": ErrorResponse},
    },
)
async def get_tasks(
    user_id: UUID,
    status: str = "all",
    priority: str = None,
    due_date: str = None,
    tags: str = None,
    search: str = None,
    sort: str = "created",
    sort_direction: str = "desc",
    page: int = 1,
    limit: int = 20,
    current_user: Dict[str, Any] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> TaskListResponse:
    """
    Get all tasks for the authenticated user with comprehensive filtering, sorting, and pagination.

    Args:
        user_id: User ID from URL path
        status: Filter by status (all|pending|completed, default: all)
        priority: Filter by priority level (low|medium|high, optional)
        due_date: Filter by due date (YYYY-MM-DD format, optional)
        tags: Filter by tags (comma-separated string, optional)
        search: Search in title and description (optional)
        sort: Sort by field (created|title|updated|priority|due_date, default: created)
        sort_direction: Sort direction (asc|desc, default: desc)
        page: Page number for pagination (default: 1)
        limit: Number of tasks per page (default: 20)
        current_user: Current authenticated user from JWT
        db: Database session

    Returns:
        TaskListResponse: List of tasks with pagination metadata

    Raises:
        HTTPException: If user not authorized or invalid query parameters
    """
    # Verify user_id from JWT matches URL path
    if str(current_user["id"]) != str(user_id):
        raise HTTPException(status_code=403, detail="User ID in token does not match URL path")

    # Validate query parameters
    if page < 1:
        raise HTTPException(status_code=400, detail="Page must be greater than 0")
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="Limit must be between 1 and 100")

    if status and status.lower() not in ["all", "pending", "completed"]:
        raise HTTPException(status_code=400, detail="Status must be one of: all, pending, completed")

    if priority and priority.lower() not in ["low", "medium", "high"]:
        raise HTTPException(status_code=400, detail="Priority must be one of: low, medium, high")

    if sort and sort.lower() not in ["created", "title", "updated", "priority", "due_date"]:
        raise HTTPException(status_code=400, detail="Sort must be one of: created, title, updated, priority, due_date")

    if sort_direction and sort_direction.lower() not in ["asc", "desc"]:
        raise HTTPException(status_code=400, detail="Sort direction must be one of: asc, desc")

    try:
        task_service = TaskService()

        # Get tasks with comprehensive filters
        tasks, total_count = task_service.get_tasks(
            db=db,
            user_id=user_id,
            status=status,
            priority=priority,
            due_date=due_date,
            tags=tags,
            search=search,
            sort=sort,
            sort_direction=sort_direction,
            page=page,
            limit=limit,
        )

        # Calculate total pages
        total_pages = (total_count + limit - 1) // limit if limit > 0 else 1

        # Convert tasks to response format
        task_responses = []
        for task in tasks:
            task_responses.append(TaskResponse(
                id=task.id,
                user_id=task.user_id,
                title=task.title,
                description=task.description,
                priority=task.priority,
                due_date=task.due_date,
                tags=task.tags if task.tags else [],
                completed=task.completed,
                created_at=task.created_at,
                updated_at=task.updated_at,
            ))

        return TaskListResponse(
            data=task_responses,
            meta={
                "total": total_count,
                "page": page,
                "limit": limit,
                "totalPages": total_pages,
            },
            success=True,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get(
    "/tasks/{task_id}",
    response_model=TaskResponse,
    responses={
        200: {"description": "Task retrieved successfully"},
        401: {"description": "Unauthorized", "model": ErrorResponse},
        403: {"description": "Forbidden access", "model": ErrorResponse},
        404: {"description": "Task not found", "model": ErrorResponse},
    },
)
async def get_task(
    user_id: UUID,
    task_id: int = Path(..., description="Task ID"),
    current_user: Dict[str, Any] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> TaskResponse:
    """
    Get a specific task by ID for the authenticated user.

    Args:
        user_id: User ID from URL path
        task_id: Task ID to retrieve
        current_user: Current authenticated user from JWT
        db: Database session

    Returns:
        TaskResponse: Task data

    Raises:
        HTTPException: If task not found or user not authorized
    """
    # Verify user_id from JWT matches URL path
    if str(current_user["id"]) != str(user_id):
        raise HTTPException(status_code=403, detail="User ID in token does not match URL path")

    try:
        task_service = TaskService()
        task = task_service.get_task_by_id(db=db, user_id=user_id, task_id=task_id)

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        return TaskResponse(
            id=task.id,
            user_id=task.user_id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            due_date=task.due_date,
            tags=task.tags if task.tags else [],
            completed=task.completed,
            created_at=task.created_at,
            updated_at=task.updated_at,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put(
    "/tasks/{task_id}",
    response_model=TaskResponse,
    responses={
        200: {"description": "Task updated successfully"},
        400: {"description": "Validation error", "model": ErrorResponse},
        401: {"description": "Unauthorized", "model": ErrorResponse},
        403: {"description": "Forbidden access", "model": ErrorResponse},
        404: {"description": "Task not found", "model": ErrorResponse},
    },
)
async def update_task(
    user_id: UUID,
    request: UpdateTaskRequest,
    task_id: int = Path(..., description="Task ID"),
    current_user: Dict[str, Any] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> TaskResponse:
    """
    Update a task for the authenticated user.

    Args:
        user_id: User ID from URL path
        request: Task update request data
        task_id: Task ID to update
        current_user: Current authenticated user from JWT
        db: Database session

    Returns:
        TaskResponse: Updated task data

    Raises:
        HTTPException: If validation fails, task not found, or user not authorized
    """
    # Verify user_id from JWT matches URL path
    if str(current_user["id"]) != str(user_id):
        raise HTTPException(status_code=403, detail="User ID in token does not match URL path")

    try:
        task_service = TaskService()
        updated_task = task_service.update_task(
            db=db,
            user_id=user_id,
            task_id=task_id,
            title=request.title,
            description=request.description,
            priority=request.priority,
            due_date=request.due_date,
            tags=request.tags,
        )

        if not updated_task:
            raise HTTPException(status_code=404, detail="Task not found")

        return TaskResponse(
            id=updated_task.id,
            user_id=updated_task.user_id,
            title=updated_task.title,
            description=updated_task.description,
            priority=updated_task.priority,
            due_date=updated_task.due_date,
            tags=updated_task.tags if updated_task.tags else [],
            completed=updated_task.completed,
            created_at=updated_task.created_at,
            updated_at=updated_task.updated_at,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete(
    "/tasks/{task_id}",
    response_model=SuccessResponse,
    responses={
        200: {"description": "Task deleted successfully"},
        401: {"description": "Unauthorized", "model": ErrorResponse},
        403: {"description": "Forbidden access", "model": ErrorResponse},
        404: {"description": "Task not found", "model": ErrorResponse},
    },
)
async def delete_task(
    user_id: UUID,
    task_id: int = Path(..., description="Task ID"),
    current_user: Dict[str, Any] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> SuccessResponse:
    """
    Delete a task for the authenticated user.

    Args:
        user_id: User ID from URL path
        task_id: Task ID to delete
        current_user: Current authenticated user from JWT
        db: Database session

    Returns:
        SuccessResponse: Success message

    Raises:
        HTTPException: If task not found or user not authorized
    """
    # Verify user_id from JWT matches URL path
    if str(current_user["id"]) != str(user_id):
        raise HTTPException(status_code=403, detail="User ID in token does not match URL path")

    try:
        task_service = TaskService()
        deleted = task_service.delete_task(db=db, user_id=user_id, task_id=task_id)

        if not deleted:
            raise HTTPException(status_code=404, detail="Task not found")

        return SuccessResponse(
            success=True,
            message="Task deleted successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch(
    "/tasks/{task_id}/complete",
    response_model=TaskResponse,
    responses={
        200: {"description": "Task completion status updated"},
        400: {"description": "Validation error", "model": ErrorResponse},
        401: {"description": "Unauthorized", "model": ErrorResponse},
        403: {"description": "Forbidden access", "model": ErrorResponse},
        404: {"description": "Task not found", "model": ErrorResponse},
    },
)
async def toggle_task_complete(
    user_id: UUID,
    request: ToggleCompleteRequest,
    task_id: int = Path(..., description="Task ID"),
    current_user: Dict[str, Any] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> TaskResponse:
    """
    Toggle completion status of a task for the authenticated user.

    Args:
        user_id: User ID from URL path
        request: Toggle completion request data
        task_id: Task ID to update
        current_user: Current authenticated user from JWT
        db: Database session

    Returns:
        TaskResponse: Updated task data

    Raises:
        HTTPException: If validation fails, task not found, or user not authorized
    """
    # Verify user_id from JWT matches URL path
    if str(current_user["id"]) != str(user_id):
        raise HTTPException(status_code=403, detail="User ID in token does not match URL path")

    try:
        task_service = TaskService()
        updated_task = task_service.toggle_complete(
            db=db,
            user_id=user_id,
            task_id=task_id,
            completed=request.completed
        )

        if not updated_task:
            raise HTTPException(status_code=404, detail="Task not found")

        return TaskResponse(
            id=updated_task.id,
            user_id=updated_task.user_id,
            title=updated_task.title,
            description=updated_task.description,
            priority=updated_task.priority,
            due_date=updated_task.due_date,
            tags=updated_task.tags if updated_task.tags else [],
            completed=updated_task.completed,
            created_at=updated_task.created_at,
            updated_at=updated_task.updated_at,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get(
    "/tasks/export",
    responses={
        200: {"description": "Tasks exported successfully"},
        400: {"description": "Invalid format parameter", "model": ErrorResponse},
        401: {"description": "Unauthorized", "model": ErrorResponse},
        403: {"description": "Forbidden access", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse},
    },
)
@advanced_features_limiter.limit("10/minute")
async def export_tasks(
    request: Request,
    user_id: UUID,
    format: str = Query(..., description="Export format: csv or json"),
    current_user: Dict[str, Any] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> Response:
    """
    Export all tasks for the authenticated user to CSV or JSON format.

    Args:
        user_id: User ID from URL path
        format: Export format (csv or json)
        current_user: Current authenticated user from JWT
        db: Database session

    Returns:
        Response: File download with appropriate Content-Type

    Raises:
        HTTPException: If user not authorized or invalid format
    """
    # Verify user_id from JWT matches URL path
    if str(current_user["id"]) != str(user_id):
        raise HTTPException(status_code=403, detail="User ID in token does not match URL path")

    # Validate format parameter
    if format.lower() not in ["csv", "json"]:
        raise HTTPException(status_code=400, detail="Format must be 'csv' or 'json'")

    try:
        task_service = TaskService()
        export_service = ExportService()

        # Get all tasks for user (no pagination for export)
        tasks, _ = task_service.get_tasks(
            db=db,
            user_id=user_id,
            page=1,
            limit=10000  # Large limit to get all tasks
        )

        # Export based on format
        if format.lower() == "csv":
            content = export_service.export_to_csv(tasks)
            media_type = "text/csv"
            filename = f"tasks_{user_id}.csv"
        else:  # json
            content = export_service.export_to_json(tasks)
            media_type = "application/json"
            filename = f"tasks_{user_id}.json"

        # Return file as download
        return Response(
            content=content,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post(
    "/tasks/import",
    response_model=ImportResponse,
    responses={
        200: {"description": "Tasks imported successfully"},
        400: {"description": "Invalid file or format", "model": ErrorResponse},
        401: {"description": "Unauthorized", "model": ErrorResponse},
        403: {"description": "Forbidden access", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse},
    },
)
@advanced_features_limiter.limit("10/minute")
async def import_tasks(
    request: Request,
    user_id: UUID,
    file: UploadFile = File(..., description="CSV or JSON file to import"),
    current_user: Dict[str, Any] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> ImportResponse:
    """
    Import tasks from CSV or JSON file for the authenticated user.

    Args:
        user_id: User ID from URL path
        file: Uploaded file (CSV or JSON)
        current_user: Current authenticated user from JWT
        db: Database session

    Returns:
        ImportResponse: Import result with count of imported tasks and errors

    Raises:
        HTTPException: If user not authorized or invalid file
    """
    # Verify user_id from JWT matches URL path
    if str(current_user["id"]) != str(user_id):
        raise HTTPException(status_code=403, detail="User ID in token does not match URL path")

    # Validate file size (max 10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    file_content_bytes = await file.read()

    if len(file_content_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    # Decode file content
    try:
        file_content = file_content_bytes.decode('utf-8')
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded text")

    # Determine file format based on filename extension
    filename = file.filename.lower()
    if filename.endswith('.csv'):
        file_format = 'csv'
    elif filename.endswith('.json'):
        file_format = 'json'
    else:
        raise HTTPException(status_code=400, detail="File must be CSV or JSON format (.csv or .json)")

    try:
        import_service = ImportService()
        task_service = TaskService()

        # Parse file based on format
        if file_format == 'csv':
            valid_tasks, errors = import_service.parse_csv(file_content)
        else:  # json
            valid_tasks, errors = import_service.parse_json(file_content)

        # Import valid tasks
        imported_count = 0
        for task_data in valid_tasks:
            try:
                task_service.create_task(
                    db=db,
                    user_id=user_id,
                    title=task_data['title'],
                    description=task_data.get('description'),
                    priority=task_data.get('priority', 'medium'),
                    due_date=task_data.get('due_date'),
                    tags=task_data.get('tags', []),
                )
                imported_count += 1
            except Exception as e:
                errors.append(f"Error importing task '{task_data.get('title', 'Unknown')}': {str(e)}")

        # Return import result
        return ImportResponse(
            success=True,
            data=ImportResult(
                imported=imported_count,
                errors=len(errors),
                errors_list=errors if errors else None
            )
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import error: {str(e)}")


@router.get(
    "/tasks/statistics",
    response_model=StatisticsResponse,
    responses={
        200: {"description": "Statistics retrieved successfully"},
        401: {"description": "Unauthorized", "model": ErrorResponse},
        403: {"description": "Forbidden access", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse},
    },
)
@advanced_features_limiter.limit("10/minute")
async def get_statistics(
    request: Request,
    user_id: UUID,
    current_user: Dict[str, Any] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> StatisticsResponse:
    """
    Get task statistics for the authenticated user.

    Args:
        user_id: User ID from URL path
        current_user: Current authenticated user from JWT
        db: Database session

    Returns:
        StatisticsResponse: Task statistics (total, completed, pending, overdue)

    Raises:
        HTTPException: If user not authorized
    """
    # Verify user_id from JWT matches URL path
    if str(current_user["id"]) != str(user_id):
        raise HTTPException(status_code=403, detail="User ID in token does not match URL path")

    try:
        task_service = TaskService()
        stats = task_service.get_statistics(db=db, user_id=user_id)

        return StatisticsResponse(
            success=True,
            data=StatisticsData(
                total=stats['total'],
                completed=stats['completed'],
                pending=stats['pending'],
                overdue=stats['overdue']
            )
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post(
    "/tasks/bulk",
    response_model=BulkOperationResponse,
    responses={
        200: {"description": "Bulk operation completed successfully"},
        400: {"description": "Validation error", "model": ErrorResponse},
        401: {"description": "Unauthorized", "model": ErrorResponse},
        403: {"description": "Forbidden access", "model": ErrorResponse},
        404: {"description": "One or more tasks not found", "model": ErrorResponse},
        429: {"description": "Rate limit exceeded", "model": ErrorResponse},
    },
)
@advanced_features_limiter.limit("10/minute")
async def bulk_operations(
    http_request: Request,
    user_id: UUID,
    request: BulkOperationRequest,
    current_user: Dict[str, Any] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> BulkOperationResponse:
    """
    Perform bulk operations on multiple tasks with database transactions.

    Args:
        user_id: User ID from URL path
        request: Bulk operation request (action, task_ids, priority)
        current_user: Current authenticated user from JWT
        db: Database session

    Returns:
        BulkOperationResponse: Number of tasks affected

    Raises:
        HTTPException: If user not authorized, validation fails, or task not found
    """
    # Verify user_id from JWT matches URL path
    if str(current_user["id"]) != str(user_id):
        raise HTTPException(status_code=403, detail="User ID in token does not match URL path")

    try:
        task_service = TaskService()

        # Perform bulk operation based on action
        if request.action == "delete":
            affected = task_service.bulk_delete(db=db, user_id=user_id, task_ids=request.task_ids)
        elif request.action == "complete":
            affected = task_service.bulk_complete(db=db, user_id=user_id, task_ids=request.task_ids)
        elif request.action == "pending":
            affected = task_service.bulk_pending(db=db, user_id=user_id, task_ids=request.task_ids)
        elif request.action == "priority":
            affected = task_service.bulk_priority_change(
                db=db,
                user_id=user_id,
                task_ids=request.task_ids,
                priority=request.priority
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid action")

        return BulkOperationResponse(
            success=True,
            data=BulkOperationData(affected=affected)
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Check if it's a task not found error
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")