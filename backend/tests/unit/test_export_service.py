"""
Unit tests for export_service.py.

This module tests export service for converting tasks to CSV and JSON formats.
"""

import pytest
import json
import csv
from datetime import datetime, timedelta
from io import StringIO
from uuid import uuid4

from services.export_service import ExportService
from models import Task


@pytest.mark.unit
class TestExportService:
    """Test suite for ExportService class."""

    def test_export_to_csv_success_returns_valid_csv(self, sample_tasks):
        """Test exporting tasks to CSV returns valid CSV format."""
        # Arrange
        export_service = ExportService()

        # Act
        csv_content = export_service.export_to_csv(sample_tasks)

        # Assert
        assert csv_content is not None
        assert len(csv_content) > 0

        # Verify CSV structure
        reader = csv.DictReader(StringIO(csv_content))
        rows = list(reader)

        assert len(rows) == len(sample_tasks)
        assert reader.fieldnames == [
            'id', 'user_id', 'title', 'description', 'priority',
            'due_date', 'tags', 'completed', 'created_at', 'updated_at'
        ]

        # Verify first row data
        first_row = rows[0]
        assert first_row['title'] == sample_tasks[0].title
        assert first_row['priority'] == sample_tasks[0].priority

    def test_export_to_csv_empty_list_returns_header_only(self):
        """Test exporting empty task list returns CSV with header only."""
        # Arrange
        export_service = ExportService()
        empty_tasks = []

        # Act
        csv_content = export_service.export_to_csv(empty_tasks)

        # Assert
        assert csv_content is not None
        lines = csv_content.strip().split('\n')
        assert len(lines) == 1  # Header only
        assert 'id,user_id,title' in lines[0]

    def test_export_to_csv_handles_special_characters(self):
        """Test exporting tasks with special characters in CSV."""
        # Arrange
        export_service = ExportService()
        user_id = uuid4()

        task_with_special_chars = Task(
            user_id=user_id,
            title='Task with "quotes" and, commas',
            description="Line 1\nLine 2\nLine 3",
            priority="medium",
            tags=["tag,with,commas", "tag\"with\"quotes"],
            completed=False
        )

        # Act
        csv_content = export_service.export_to_csv([task_with_special_chars])

        # Assert
        assert csv_content is not None
        assert '"quotes"' in csv_content or 'quotes' in csv_content

        # Verify CSV can be parsed
        reader = csv.DictReader(StringIO(csv_content))
        rows = list(reader)
        assert len(rows) == 1

    def test_export_to_csv_handles_null_fields(self):
        """Test exporting tasks with null/empty optional fields."""
        # Arrange
        export_service = ExportService()
        user_id = uuid4()

        task_with_nulls = Task(
            user_id=user_id,
            title="Minimal Task",
            description=None,
            priority="medium",
            due_date=None,
            tags=[],
            completed=False
        )

        # Act
        csv_content = export_service.export_to_csv([task_with_nulls])

        # Assert
        assert csv_content is not None

        # Verify CSV parsing
        reader = csv.DictReader(StringIO(csv_content))
        rows = list(reader)
        assert len(rows) == 1
        assert rows[0]['description'] == ''
        assert rows[0]['due_date'] == ''
        assert rows[0]['tags'] == ''

    def test_export_to_json_success_returns_valid_json(self, sample_tasks):
        """Test exporting tasks to JSON returns valid JSON format."""
        # Arrange
        export_service = ExportService()

        # Act
        json_content = export_service.export_to_json(sample_tasks)

        # Assert
        assert json_content is not None

        # Verify JSON structure
        tasks_data = json.loads(json_content)
        assert isinstance(tasks_data, list)
        assert len(tasks_data) == len(sample_tasks)

        # Verify first task data
        first_task = tasks_data[0]
        assert first_task['title'] == sample_tasks[0].title
        assert first_task['priority'] == sample_tasks[0].priority
        assert 'id' in first_task
        assert 'user_id' in first_task
        assert 'created_at' in first_task

    def test_export_to_json_empty_list_returns_empty_array(self):
        """Test exporting empty task list returns empty JSON array."""
        # Arrange
        export_service = ExportService()
        empty_tasks = []

        # Act
        json_content = export_service.export_to_json(empty_tasks)

        # Assert
        assert json_content is not None
        tasks_data = json.loads(json_content)
        assert isinstance(tasks_data, list)
        assert len(tasks_data) == 0

    def test_export_to_json_handles_null_fields(self):
        """Test exporting tasks with null fields to JSON."""
        # Arrange
        export_service = ExportService()
        user_id = uuid4()

        task_with_nulls = Task(
            user_id=user_id,
            title="Minimal Task",
            description=None,
            priority="medium",
            due_date=None,
            tags=None,
            completed=False
        )

        # Act
        json_content = export_service.export_to_json([task_with_nulls])

        # Assert
        assert json_content is not None
        tasks_data = json.loads(json_content)
        assert len(tasks_data) == 1

        first_task = tasks_data[0]
        assert first_task['description'] is None
        assert first_task['due_date'] is None
        assert first_task['tags'] == []

    def test_export_to_json_datetime_serialization(self):
        """Test JSON export correctly serializes datetime fields."""
        # Arrange
        export_service = ExportService()
        user_id = uuid4()
        due_date = datetime.utcnow() + timedelta(days=7)

        task = Task(
            user_id=user_id,
            title="Task with date",
            priority="medium",
            due_date=due_date,
            completed=False
        )

        # Act
        json_content = export_service.export_to_json([task])

        # Assert
        tasks_data = json.loads(json_content)
        first_task = tasks_data[0]

        # Verify datetime is in ISO format
        assert 'T' in first_task['created_at']
        assert 'T' in first_task['updated_at']
        if first_task['due_date']:
            assert 'T' in first_task['due_date']

    def test_export_to_json_preserves_data_types(self, sample_tasks):
        """Test JSON export preserves correct data types."""
        # Arrange
        export_service = ExportService()

        # Act
        json_content = export_service.export_to_json(sample_tasks)
        tasks_data = json.loads(json_content)

        # Assert
        for task_data in tasks_data:
            assert isinstance(task_data['id'], int)
            assert isinstance(task_data['user_id'], str)
            assert isinstance(task_data['title'], str)
            assert isinstance(task_data['priority'], str)
            assert isinstance(task_data['completed'], bool)
            assert isinstance(task_data['tags'], list)
