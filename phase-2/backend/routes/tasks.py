"""
Task management API routes.

This module provides endpoints for task CRUD operations with user isolation.
"""

from datetime import datetime
from typing import Dict, List, Any
from enum import Enum
# Removed UUID import - Better Auth uses string IDs

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status, Body
from fastapi.responses import Response, JSONResponse
from sqlmodel import Session

from db import get_session
from middleware.jwt import verify_jwt_token
from schemas.query_params import TaskQueryParams
from schemas.requests import CreateTaskRequest, ToggleCompleteRequest, UpdateTaskRequest
from schemas.responses import (
    DeleteTaskResponse,
    PaginationMeta,
    SingleTaskResponse,
    TaskListResponse,
    TaskResponse,
)
from services.export_import_service import ExportImportService
from services.task_service import TaskService

router = APIRouter(prefix="/api", tags=["tasks"])


class ExportFormat(str, Enum):
    """Export format options."""
    CSV = "csv"
    JSON = "json"
    PDF = "pdf"

    @classmethod
    def _missing_(cls, value):
        """Handle case-insensitive matching."""
        if isinstance(value, str):
            value_lower = value.lower()
            for member in cls:
                if member.value.lower() == value_lower:
                    return member
        return None


def verify_user_access(user_id: str, current_user: Dict[str, str]) -> None:
    """
    Verify that authenticated user has access to the requested user_id.

    Args:
        user_id: User ID from URL path
        current_user: User information from JWT token

    Raises:
        HTTPException: 403 if user_id mismatch
    """
    if current_user["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": {
                    "code": "FORBIDDEN",
                    "message": "User ID mismatch: You can only access your own data",
                },
            },
        )


@router.post(
    "/{user_id}/tasks",
    response_model=SingleTaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
    description="Create a new task for the authenticated user with user isolation enforcement",
)
async def create_task(
    user_id: str,
    task_data: CreateTaskRequest,
    current_user: Dict[str, str] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> SingleTaskResponse:
    """
    Create a new task for the authenticated user.

    Args:
        user_id: User ID from URL path
        task_data: Task creation data
        current_user: User information from JWT token
        db: Database session

    Returns:
        SingleTaskResponse: Created task data

    Raises:
        HTTPException: 401 if not authenticated, 403 if user_id mismatch
    """
    # Verify user_id matches JWT token
    verify_user_access(user_id, current_user)

    try:
        # Create task with user isolation
        user_id_str = current_user["user_id"]
        task = TaskService.create_task(db, user_id_str, task_data)

        # Convert to response model
        task_response = TaskResponse.model_validate(task)
        return SingleTaskResponse(success=True, data=task_response)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": str(e)},
            },
        )


@router.get(
    "/{user_id}/tasks",
    summary="Get all tasks with filtering, sorting, search, and pagination",
    description="Get tasks for the authenticated user with comprehensive query parameters support",
)
async def get_tasks(
    user_id: str,
    query_params: TaskQueryParams = Depends(),
    current_user: Dict[str, str] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
):
    """
    Get tasks for the authenticated user with filtering, sorting, search, and pagination.

    Query Parameters:
        - status: Filter by completion status (all, pending, completed) [default: all]
        - priority: Filter by priority (low, medium, high)
        - due_date_from: Filter tasks with due date from this date (ISO 8601)
        - due_date_to: Filter tasks with due date until this date (ISO 8601)
        - tags: Comma-separated list of tags to filter by
        - sort: Sort order (format: field:direction) [default: created:desc]
          Available fields: created, title, updated, priority, due_date
          Directions: asc, desc
        - search: Search keyword for title and description
        - page: Page number [default: 1]
        - limit: Items per page (1-100) [default: 50]

    Args:
        user_id: User ID from URL path
        query_params: Query parameters for filtering, sorting, search, and pagination
        current_user: User information from JWT token
        db: Database session

    Returns:
        TaskListResponse: List of tasks with pagination metadata

    Raises:
        HTTPException: 401 if not authenticated, 403 if user_id mismatch, 400 if invalid query params
    """
    # Verify user_id matches JWT token
    verify_user_access(user_id, current_user)

    try:
        # Get tasks with filtering, sorting, search, and pagination
        user_id_str = current_user["user_id"]
        tasks, metadata = TaskService.get_tasks(db, user_id_str, query_params)

        # Convert to response models
        task_responses = [TaskResponse.model_validate(task) for task in tasks]
        pagination_meta = PaginationMeta(**metadata)

        # Return in format expected by frontend: { success: true, data: { items: [...], total, page, limit, totalPages } }
        return JSONResponse(
            content={
                "success": True,
                "data": {
                    "items": [task.model_dump(mode='json') for task in task_responses],
                    "total": pagination_meta.total,
                    "page": pagination_meta.page,
                    "limit": pagination_meta.limit,
                    "totalPages": pagination_meta.totalPages,
                }
            }
        )

    except ValueError as e:
        # Log the error for debugging
        import logging
        logger = logging.getLogger("todo_api")
        logger.error(f"Validation error in get_tasks: {str(e)}", exc_info=True)
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": str(e)},
            },
        )
    except Exception as e:
        # Catch any other unexpected errors
        import logging
        logger = logging.getLogger("todo_api")
        logger.error(f"Unexpected error in get_tasks: {str(e)}", exc_info=True)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"},
            },
        )


# IMPORTANT: Specific routes like /export must come BEFORE generic parameter routes like /{task_id}
# to ensure proper route matching in FastAPI
@router.get(
    "/{user_id}/tasks/export",
    summary="Export tasks",
    description="Export user's tasks to CSV, JSON, or PDF format with user isolation enforcement",
)
async def export_tasks(
    user_id: str,
    format_param: str = Query(
        ...,
        alias="format",
        pattern="^(csv|json|pdf)$",
        description="Export format: csv, json, or pdf"
    ),
    current_user: Dict[str, str] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> Response:
    """
    Export all tasks for authenticated user to CSV, JSON, or PDF file.

    Args:
        user_id: User ID from URL path
        format_param: Export format (csv, json, or pdf)
        current_user: User information from JWT token
        db: Database session

    Returns:
        Response: File download with exported tasks in the specified format

    Raises:
        HTTPException: 401 if not authenticated, 403 if user_id mismatch, 400 if invalid format
    """
    # Verify user_id matches JWT token
    verify_user_access(user_id, current_user)

    # Get all tasks for user
    user_id_str = current_user["user_id"]
    tasks, _ = TaskService.get_tasks(db, user_id_str, query_params=None)

    # Generate timestamp for filename
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')

    # Export based on format
    format_lower = format_param.lower()

    if format_lower == "csv":
        file_content_str = ExportImportService.export_tasks_csv(tasks)
        content_type = "text/csv"
        filename = f"tasks_export_{timestamp}.csv"
        file_content = file_content_str.encode("utf-8")

    elif format_lower == "json":
        file_content_str = ExportImportService.export_tasks_json(tasks)
        content_type = "application/json"
        filename = f"tasks_export_{timestamp}.json"
        file_content = file_content_str.encode("utf-8")

    elif format_lower == "pdf":
        # PDF export returns bytes directly
        file_content = ExportImportService.export_tasks_pdf(tasks)
        content_type = "application/pdf"
        filename = f"tasks_export_{timestamp}.pdf"

    else:
        # This should not happen due to regex validation, but handle it anyway
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid export format. Supported formats: csv, json, pdf"
                },
            },
        )

    return Response(
        content=file_content,
        media_type=content_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get(
    "/{user_id}/tasks/{task_id}",
    response_model=SingleTaskResponse,
    summary="Get task by ID",
    description="Get a specific task by ID for the authenticated user with user isolation enforcement",
)
async def get_task(
    user_id: str,
    task_id: int,
    current_user: Dict[str, str] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> SingleTaskResponse:
    """
    Get a specific task by ID.

    Args:
        user_id: User ID from URL path
        task_id: Task ID to retrieve
        current_user: User information from JWT token
        db: Database session

    Returns:
        SingleTaskResponse: Task data

    Raises:
        HTTPException: 401 if not authenticated, 403 if user_id mismatch, 404 if task not found
    """
    # Verify user_id matches JWT token
    verify_user_access(user_id, current_user)

    # Get task with user isolation verification
    user_id_str = current_user["user_id"]
    task = TaskService.get_task_by_id(db, user_id_str, task_id)

    # Convert to response model
    task_response = TaskResponse.model_validate(task)
    return SingleTaskResponse(success=True, data=task_response)


@router.put(
    "/{user_id}/tasks/{task_id}",
    response_model=SingleTaskResponse,
    summary="Update task",
    description="Update a task's details for the authenticated user with user isolation enforcement",
)
async def update_task(
    user_id: str,
    task_id: int,
    task_data: UpdateTaskRequest,
    current_user: Dict[str, str] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> SingleTaskResponse:
    """
    Update a task's details.

    Args:
        user_id: User ID from URL path
        task_id: Task ID to update
        task_data: Updated task data
        current_user: User information from JWT token
        db: Database session

    Returns:
        SingleTaskResponse: Updated task data

    Raises:
        HTTPException: 401 if not authenticated, 403 if user_id mismatch, 404 if task not found
    """
    # Verify user_id matches JWT token
    verify_user_access(user_id, current_user)

    try:
        # Update task with user isolation verification
        user_id_str = current_user["user_id"]
        task = TaskService.update_task(db, user_id_str, task_id, task_data)

        # Convert to response model
        task_response = TaskResponse.model_validate(task)
        return SingleTaskResponse(success=True, data=task_response)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": str(e)},
            },
        )


@router.delete(
    "/{user_id}/tasks/{task_id}",
    response_model=DeleteTaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete task",
    description="Delete a task for the authenticated user with user isolation enforcement",
)
async def delete_task(
    user_id: str,
    task_id: int,
    current_user: Dict[str, str] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> DeleteTaskResponse:
    """
    Delete a task.

    Args:
        user_id: User ID from URL path
        task_id: Task ID to delete
        current_user: User information from JWT token
        db: Database session

    Returns:
        DeleteTaskResponse: Success message

    Raises:
        HTTPException: 401 if not authenticated, 403 if user_id mismatch, 404 if task not found
    """
    # Verify user_id matches JWT token
    verify_user_access(user_id, current_user)

    # Delete task with user isolation verification
    user_id_str = current_user["user_id"]
    TaskService.delete_task(db, user_id_str, task_id)

    return DeleteTaskResponse(success=True, message="Task deleted successfully")


@router.patch(
    "/{user_id}/tasks/{task_id}/complete",
    response_model=SingleTaskResponse,
    summary="Toggle task completion",
    description="Toggle a task's completion status for the authenticated user with user isolation enforcement",
)
async def toggle_complete(
    user_id: str,
    task_id: int,
    complete_data: ToggleCompleteRequest,
    current_user: Dict[str, str] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> SingleTaskResponse:
    """
    Toggle a task's completion status.

    Args:
        user_id: User ID from URL path
        task_id: Task ID to toggle
        complete_data: Completion status data
        current_user: User information from JWT token
        db: Database session

    Returns:
        SingleTaskResponse: Updated task data

    Raises:
        HTTPException: 401 if not authenticated, 403 if user_id mismatch, 404 if task not found
    """
    # Verify user_id matches JWT token
    verify_user_access(user_id, current_user)

    # Toggle completion with user isolation verification
    user_id_str = current_user["user_id"]
    task = TaskService.toggle_complete(db, user_id_str, task_id, complete_data.completed)

    # Convert to response model
    task_response = TaskResponse.model_validate(task)
    return SingleTaskResponse(success=True, data=task_response)


# ============================================================================
# ADVANCED FEATURES: Export, Import, Statistics, Bulk Operations
# ============================================================================


@router.post(
    "/{user_id}/tasks/reorder",
    summary="Reorder tasks",
    description="Update the order of tasks for authenticated user",
)
async def reorder_tasks(
    user_id: str,
    task_ids: List[int] = Body(...),
    current_user: Dict[str, str] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> Dict[str, Any]:
    """
    Reorder tasks for authenticated user.

    Note: In the current implementation, tasks don't have an explicit order field,
    but this endpoint is provided for compatibility with drag-and-drop UI.
    The order is typically maintained by the frontend using the task IDs.

    Args:
        user_id: User ID from URL path
        task_ids: List of task IDs in the desired order
        current_user: User information from JWT token
        db: Database session

    Returns:
        Dict: Result with count of reordered tasks

    Raises:
        HTTPException: 401 if not authenticated, 403 if user_id mismatch
    """
    # Verify user_id matches JWT token
    verify_user_access(user_id, current_user)

    user_id_str = current_user["user_id"]
    
    # Verify all tasks belong to the user
    for task_id in task_ids:
        task = TaskService.get_task_by_id(db, user_id_str, task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "error": {"code": "TASK_NOT_FOUND", "message": f"Task {task_id} not found"},
                },
            )

    # In this implementation, we just verify the tasks exist and belong to the user
    # The frontend maintains the order client-side
    return {
        "success": True,
        "data": {"reordered": len(task_ids)},
    }


@router.post(
    "/{user_id}/tasks/import",
    summary="Import tasks",
    description="Import tasks from CSV or JSON file with validation and error reporting",
)
async def import_tasks(
    user_id: str,
    file: UploadFile = File(..., description="CSV or JSON file containing tasks"),
    current_user: Dict[str, str] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> Dict[str, Any]:
    """
    Import tasks from CSV or JSON file for authenticated user.

    Args:
        user_id: User ID from URL path
        file: Uploaded file (CSV or JSON)
        current_user: User information from JWT token
        db: Database session

    Returns:
        Dict: Import statistics with imported count, errors count, and error list

    Raises:
        HTTPException: 400 if invalid file type, 401 if not authenticated, 403 if user_id mismatch
    """
    # Verify user_id matches JWT token
    verify_user_access(user_id, current_user)

    # Validate file type
    if file.content_type not in ["text/csv", "application/json", "application/octet-stream"]:
        if not (file.filename.endswith(".csv") or file.filename.endswith(".json")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "Invalid file type. Only CSV and JSON files are supported",
                    },
                },
            )

    # Read file content
    content = await file.read()
    content_str = content.decode("utf-8")

    # Determine format from filename
    user_id_str = current_user["user_id"]
    if file.filename.endswith(".csv"):
        result = ExportImportService.import_tasks_csv(db, user_id_str, content_str)
    else:  # json
        result = ExportImportService.import_tasks_json(db, user_id_str, content_str)

    return {
        "success": True,
        "data": {
            "imported": result["imported"],
            "errors": result["errors"],
            "errors_list": result.get("errors_list"),
        },
    }


@router.get(
    "/{user_id}/tasks/statistics",
    summary="Get task statistics",
    description="Get aggregated task statistics for authenticated user",
)
async def get_task_statistics(
    user_id: str,
    current_user: Dict[str, str] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> Dict[str, Any]:
    """
    Get task statistics for authenticated user.

    Args:
        user_id: User ID from URL path
        current_user: User information from JWT token
        db: Database session

    Returns:
        Dict: Statistics including total, completed, pending, overdue, and priority breakdown

    Raises:
        HTTPException: 401 if not authenticated, 403 if user_id mismatch
    """
    # Verify user_id matches JWT token
    verify_user_access(user_id, current_user)

    # Get statistics
    user_id_str = current_user["user_id"]
    statistics = TaskService.get_task_statistics(db, user_id_str)

    return {"success": True, "data": statistics}


@router.post(
    "/{user_id}/tasks/bulk",
    summary="Perform bulk operations",
    description="Perform bulk operations on multiple tasks (delete, complete, pending, priority changes)",
)
async def bulk_operations(
    user_id: str,
    operation: str = Query(
        ...,
        regex="^(delete|complete|pending|priority_low|priority_medium|priority_high)$",
        description="Bulk operation type",
    ),
    task_ids: List[int] = Query(..., description="List of task IDs to operate on"),
    current_user: Dict[str, str] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
) -> Dict[str, Any]:
    """
    Perform bulk operations on tasks for authenticated user.

    Supported operations:
    - delete: Delete selected tasks
    - complete: Mark selected tasks as completed
    - pending: Mark selected tasks as pending
    - priority_low: Set selected tasks priority to low
    - priority_medium: Set selected tasks priority to medium
    - priority_high: Set selected tasks priority to high

    Args:
        user_id: User ID from URL path
        operation: Operation to perform
        task_ids: List of task IDs
        current_user: User information from JWT token
        db: Database session

    Returns:
        Dict: Results with success count and failed count

    Raises:
        HTTPException: 400 if invalid operation, 401 if not authenticated, 403 if user_id mismatch
    """
    # Verify user_id matches JWT token
    verify_user_access(user_id, current_user)

    # Validate task_ids
    if not task_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "task_ids cannot be empty"},
            },
        )

    # Perform bulk operation
    user_id_str = current_user["user_id"]
    result = TaskService.bulk_operations(db, user_id_str, operation, task_ids)

    return {"success": True, "data": result}
