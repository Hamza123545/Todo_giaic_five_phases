"""
Export service for converting tasks to CSV and JSON formats.

This module provides functionality for exporting tasks to different file formats.
"""

import csv
import json
from io import StringIO
from typing import List

from models import Task


class ExportService:
    """Service for exporting tasks to CSV and JSON formats."""

    def export_to_csv(self, tasks: List[Task]) -> str:
        """
        Export tasks to CSV format.

        Args:
            tasks: List of Task objects to export

        Returns:
            str: CSV formatted string with all task data

        CSV Format:
            id,user_id,title,description,priority,due_date,tags,completed,created_at,updated_at
        """
        output = StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

        # Write header
        writer.writerow([
            'id',
            'user_id',
            'title',
            'description',
            'priority',
            'due_date',
            'tags',
            'completed',
            'created_at',
            'updated_at'
        ])

        # Write task data
        for task in tasks:
            writer.writerow([
                task.id,
                str(task.user_id),
                task.title,
                task.description if task.description else '',
                task.priority,
                task.due_date.isoformat() if task.due_date else '',
                ','.join(task.tags) if task.tags else '',
                str(task.completed).lower(),
                task.created_at.isoformat(),
                task.updated_at.isoformat()
            ])

        return output.getvalue()

    def export_to_json(self, tasks: List[Task]) -> str:
        """
        Export tasks to JSON format.

        Args:
            tasks: List of Task objects to export

        Returns:
            str: JSON formatted string with all task data

        JSON Format:
            [
                {
                    "id": 1,
                    "user_id": "uuid",
                    "title": "Task title",
                    "description": "Task description",
                    "priority": "medium",
                    "due_date": "2024-12-31T23:59:59",
                    "tags": ["tag1", "tag2"],
                    "completed": false,
                    "created_at": "2024-01-01T00:00:00",
                    "updated_at": "2024-01-01T00:00:00"
                }
            ]
        """
        task_dicts = []

        for task in tasks:
            task_dict = {
                'id': task.id,
                'user_id': str(task.user_id),
                'title': task.title,
                'description': task.description,
                'priority': task.priority,
                'due_date': task.due_date.isoformat() if task.due_date else None,
                'tags': task.tags if task.tags else [],
                'completed': task.completed,
                'created_at': task.created_at.isoformat(),
                'updated_at': task.updated_at.isoformat()
            }
            task_dicts.append(task_dict)

        return json.dumps(task_dicts, indent=2)
