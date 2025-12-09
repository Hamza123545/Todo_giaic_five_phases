"""
Import service for parsing and validating task data from CSV and JSON files.

This module provides functionality for importing tasks from different file formats.
"""

import csv
import json
from datetime import datetime
from io import StringIO
from typing import Dict, List, Tuple


class ImportService:
    """Service for importing tasks from CSV and JSON formats with validation."""

    def parse_csv(self, file_content: str) -> Tuple[List[dict], List[str]]:
        """
        Parse CSV file content and extract task data.

        Args:
            file_content: CSV file content as string

        Returns:
            Tuple of (valid_tasks: List[dict], errors: List[str])

        CSV Expected Format:
            id,user_id,title,description,priority,due_date,tags,completed,created_at,updated_at
            (Note: id, user_id, created_at, updated_at are ignored during import)
        """
        valid_tasks = []
        errors = []

        try:
            reader = csv.DictReader(StringIO(file_content))

            for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                is_valid, error = self.validate_imported_task(row)

                if is_valid:
                    # Convert row to task dict (exclude system fields)
                    task_dict = {
                        'title': row.get('title', '').strip(),
                        'description': row.get('description', '').strip() or None,
                        'priority': row.get('priority', 'medium').lower(),
                        'due_date': self._parse_datetime(row.get('due_date')),
                        'tags': self._parse_tags(row.get('tags', '')),
                        'completed': self._parse_boolean(row.get('completed', 'false'))
                    }
                    valid_tasks.append(task_dict)
                else:
                    errors.append(f"Row {row_num}: {error}")

        except csv.Error as e:
            errors.append(f"CSV parsing error: {str(e)}")
        except Exception as e:
            errors.append(f"Unexpected error parsing CSV: {str(e)}")

        return valid_tasks, errors

    def parse_json(self, file_content: str) -> Tuple[List[dict], List[str]]:
        """
        Parse JSON file content and extract task data.

        Args:
            file_content: JSON file content as string

        Returns:
            Tuple of (valid_tasks: List[dict], errors: List[str])

        JSON Expected Format:
            [
                {
                    "title": "Task title",
                    "description": "Task description",
                    "priority": "medium",
                    "due_date": "2024-12-31T23:59:59",
                    "tags": ["tag1", "tag2"],
                    "completed": false
                }
            ]
        """
        valid_tasks = []
        errors = []

        try:
            tasks_data = json.loads(file_content)

            if not isinstance(tasks_data, list):
                errors.append("JSON must be an array of task objects")
                return valid_tasks, errors

            for idx, task in enumerate(tasks_data, start=1):
                if not isinstance(task, dict):
                    errors.append(f"Item {idx}: Must be an object/dictionary")
                    continue

                is_valid, error = self.validate_imported_task(task)

                if is_valid:
                    # Convert task to dict (exclude system fields)
                    task_dict = {
                        'title': task.get('title', '').strip(),
                        'description': task.get('description', '').strip() or None,
                        'priority': task.get('priority', 'medium').lower(),
                        'due_date': self._parse_datetime(task.get('due_date')),
                        'tags': task.get('tags', []),
                        'completed': task.get('completed', False)
                    }
                    valid_tasks.append(task_dict)
                else:
                    errors.append(f"Item {idx}: {error}")

        except json.JSONDecodeError as e:
            errors.append(f"JSON parsing error: {str(e)}")
        except Exception as e:
            errors.append(f"Unexpected error parsing JSON: {str(e)}")

        return valid_tasks, errors

    def validate_imported_task(self, task_data: dict) -> Tuple[bool, str]:
        """
        Validate imported task data.

        Args:
            task_data: Dictionary containing task fields

        Returns:
            Tuple of (is_valid: bool, error_message: str)

        Validation Rules:
            - title: Required, max 200 characters
            - description: Optional, max 1000 characters
            - priority: Must be low|medium|high
            - due_date: Optional, valid ISO 8601 format
            - tags: Optional, max 10 tags, each max 50 characters
            - completed: Boolean
        """
        # Validate title (required)
        title = task_data.get('title', '').strip()
        if not title:
            return False, "Title is required"

        if len(title) > 200:
            return False, "Title must be 200 characters or less"

        # Validate description (optional)
        description = task_data.get('description', '')
        if description and len(description) > 1000:
            return False, "Description must be 1000 characters or less"

        # Validate priority
        priority = task_data.get('priority', 'medium').lower()
        if priority not in ['low', 'medium', 'high']:
            return False, f"Invalid priority '{priority}' (must be low, medium, or high)"

        # Validate due_date (optional)
        due_date_str = task_data.get('due_date')
        if due_date_str:
            due_date = self._parse_datetime(due_date_str)
            if due_date is None:
                return False, f"Invalid due_date format '{due_date_str}' (expected ISO 8601)"

        # Validate tags (optional)
        tags = task_data.get('tags')
        if tags:
            if isinstance(tags, str):
                # Convert comma-separated string to list
                tags = [tag.strip() for tag in tags.split(',') if tag.strip()]

            if not isinstance(tags, list):
                return False, "Tags must be an array"

            if len(tags) > 10:
                return False, "Maximum 10 tags allowed"

            for tag in tags:
                if len(tag) > 50:
                    return False, f"Tag '{tag}' exceeds 50 characters"

        # Validate completed (optional)
        completed = task_data.get('completed', False)
        if not isinstance(completed, bool) and completed not in ['true', 'false', 'True', 'False', '1', '0']:
            return False, f"Invalid completed value '{completed}' (must be boolean)"

        return True, ""

    def _parse_datetime(self, datetime_str: str) -> datetime:
        """
        Parse datetime string to datetime object.

        Args:
            datetime_str: ISO 8601 formatted datetime string

        Returns:
            datetime object or None if invalid
        """
        if not datetime_str:
            return None

        try:
            # Try parsing ISO 8601 format
            if isinstance(datetime_str, str):
                # Handle various ISO 8601 formats
                return datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
            return None
        except (ValueError, AttributeError):
            return None

    def _parse_tags(self, tags_str: str) -> List[str]:
        """
        Parse comma-separated tags string to list.

        Args:
            tags_str: Comma-separated tags string

        Returns:
            List of tag strings
        """
        if not tags_str:
            return []

        if isinstance(tags_str, list):
            return tags_str

        return [tag.strip() for tag in tags_str.split(',') if tag.strip()]

    def _parse_boolean(self, bool_str: str) -> bool:
        """
        Parse boolean string to boolean value.

        Args:
            bool_str: Boolean string ('true', 'false', '1', '0', etc.)

        Returns:
            Boolean value
        """
        if isinstance(bool_str, bool):
            return bool_str

        if isinstance(bool_str, str):
            return bool_str.lower() in ['true', '1', 'yes']

        return False
