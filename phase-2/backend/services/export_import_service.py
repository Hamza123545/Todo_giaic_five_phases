"""
Export/Import service for tasks.

This module provides functionality to export tasks to CSV/JSON and import from CSV/JSON.
"""

import csv
import io
import json
from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session

from models import Task


class ExportImportService:
    """
    Service class for exporting and importing tasks.

    Supports CSV and JSON formats for both export and import operations.
    """

    @staticmethod
    def export_tasks_csv(tasks: List[Task]) -> str:
        """
        Export tasks to CSV format.

        Args:
            tasks: List of tasks to export

        Returns:
            str: CSV formatted string with task data
        """
        output = io.StringIO()
        fieldnames = [
            "id",
            "title",
            "description",
            "completed",
            "priority",
            "due_date",
            "tags",
            "created_at",
            "updated_at",
        ]

        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()

        for task in tasks:
            writer.writerow(
                {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description or "",
                    "completed": task.completed,
                    "priority": task.priority,
                    "due_date": task.due_date.isoformat() if task.due_date else "",
                    "tags": ",".join(task.tags) if task.tags else "",
                    "created_at": task.created_at.isoformat(),
                    "updated_at": task.updated_at.isoformat(),
                }
            )

        return output.getvalue()

    @staticmethod
    def export_tasks_json(tasks: List[Task]) -> str:
        """
        Export tasks to JSON format.

        Args:
            tasks: List of tasks to export

        Returns:
            str: JSON formatted string with task data
        """
        task_list = []
        for task in tasks:
            task_list.append(
                {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "completed": task.completed,
                    "priority": task.priority,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "tags": task.tags,
                    "created_at": task.created_at.isoformat(),
                    "updated_at": task.updated_at.isoformat(),
                }
            )

        return json.dumps(task_list, indent=2)

    @staticmethod
    def import_tasks_csv(db: Session, user_id: UUID, csv_content: str) -> dict:
        """
        Import tasks from CSV format.

        Args:
            db: Database session
            user_id: User ID for task ownership
            csv_content: CSV formatted string

        Returns:
            dict: Import results with success/failure counts and error details

        Raises:
            HTTPException: 400 if CSV format is invalid
        """
        try:
            # Parse CSV
            csv_file = io.StringIO(csv_content)
            reader = csv.DictReader(csv_file)

            imported = 0
            failed = 0
            errors = []

            for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                try:
                    # Validate required fields
                    if not row.get("title"):
                        errors.append(f"Row {row_num}: Missing required field 'title'")
                        failed += 1
                        continue

                    # Parse tags
                    tags = None
                    if row.get("tags"):
                        tags = [tag.strip() for tag in row["tags"].split(",") if tag.strip()]

                    # Parse due_date
                    due_date = None
                    if row.get("due_date"):
                        try:
                            due_date = datetime.fromisoformat(row["due_date"])
                        except ValueError:
                            errors.append(f"Row {row_num}: Invalid due_date format")
                            failed += 1
                            continue

                    # Parse completed
                    completed = False
                    if row.get("completed"):
                        completed_str = row["completed"].lower()
                        completed = completed_str in ["true", "1", "yes"]

                    # Validate priority
                    priority = row.get("priority", "medium").lower()
                    if priority not in ["low", "medium", "high"]:
                        errors.append(
                            f"Row {row_num}: Invalid priority '{priority}' (must be low, medium, or high)"
                        )
                        failed += 1
                        continue

                    # Create task
                    task = Task(
                        user_id=user_id,
                        title=row["title"],
                        description=row.get("description") or None,
                        priority=priority,
                        due_date=due_date,
                        tags=tags,
                        completed=completed,
                    )

                    db.add(task)
                    imported += 1

                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
                    failed += 1

            # Commit all imported tasks
            db.commit()

            return {
                "imported": imported,
                "failed": failed,
                "errors": errors[:10] if errors else [],  # Limit to first 10 errors
                "total_errors": len(errors),
            }

        except csv.Error as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid CSV format: {str(e)}",
            )
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Import failed: {str(e)}",
            )

    @staticmethod
    def import_tasks_json(db: Session, user_id: UUID, json_content: str) -> dict:
        """
        Import tasks from JSON format.

        Args:
            db: Database session
            user_id: User ID for task ownership
            json_content: JSON formatted string

        Returns:
            dict: Import results with success/failure counts and error details

        Raises:
            HTTPException: 400 if JSON format is invalid
        """
        try:
            # Parse JSON
            data = json.loads(json_content)

            if not isinstance(data, list):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="JSON must be an array of task objects",
                )

            imported = 0
            failed = 0
            errors = []

            for idx, task_data in enumerate(data):
                try:
                    # Validate required fields
                    if not task_data.get("title"):
                        errors.append(f"Task {idx + 1}: Missing required field 'title'")
                        failed += 1
                        continue

                    # Parse due_date
                    due_date = None
                    if task_data.get("due_date"):
                        try:
                            due_date = datetime.fromisoformat(task_data["due_date"])
                        except (ValueError, TypeError):
                            errors.append(f"Task {idx + 1}: Invalid due_date format")
                            failed += 1
                            continue

                    # Validate priority
                    priority = task_data.get("priority", "medium").lower()
                    if priority not in ["low", "medium", "high"]:
                        errors.append(
                            f"Task {idx + 1}: Invalid priority '{priority}' (must be low, medium, or high)"
                        )
                        failed += 1
                        continue

                    # Parse completed
                    completed = bool(task_data.get("completed", False))

                    # Parse tags
                    tags = task_data.get("tags")
                    if tags and not isinstance(tags, list):
                        errors.append(f"Task {idx + 1}: Tags must be an array")
                        failed += 1
                        continue

                    # Create task
                    task = Task(
                        user_id=user_id,
                        title=task_data["title"],
                        description=task_data.get("description") or None,
                        priority=priority,
                        due_date=due_date,
                        tags=tags,
                        completed=completed,
                    )

                    db.add(task)
                    imported += 1

                except Exception as e:
                    errors.append(f"Task {idx + 1}: {str(e)}")
                    failed += 1

            # Commit all imported tasks
            db.commit()

            return {
                "imported": imported,
                "failed": failed,
                "errors": errors[:10] if errors else [],  # Limit to first 10 errors
                "total_errors": len(errors),
            }

        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid JSON format: {str(e)}",
            )
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Import failed: {str(e)}",
            )
