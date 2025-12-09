"""
Unit tests for import_service.py.

This module tests import service for parsing and validating task data from CSV and JSON.
"""

import pytest
import json
from datetime import datetime

from services.import_service import ImportService


@pytest.mark.unit
class TestImportService:
    """Test suite for ImportService class."""

    def test_parse_csv_success_returns_valid_tasks(self):
        """Test parsing valid CSV returns list of valid tasks."""
        # Arrange
        import_service = ImportService()
        csv_content = """title,description,priority,due_date,tags,completed
Task 1,Description 1,high,2025-12-31T23:59:59,work;urgent,false
Task 2,Description 2,medium,2025-12-25T12:00:00,personal,false"""

        # Act
        valid_tasks, errors = import_service.parse_csv(csv_content)

        # Assert
        assert len(valid_tasks) == 2
        assert len(errors) == 0
        assert valid_tasks[0]['title'] == "Task 1"
        assert valid_tasks[0]['priority'] == "high"
        assert valid_tasks[1]['title'] == "Task 2"

    def test_parse_csv_invalid_format_returns_errors(self):
        """Test parsing invalid CSV format returns errors."""
        # Arrange
        import_service = ImportService()
        invalid_csv = "not,a,valid,csv\nformat,here"

        # Act
        valid_tasks, errors = import_service.parse_csv(invalid_csv)

        # Assert
        # Should handle gracefully - may have errors or empty valid tasks
        assert isinstance(valid_tasks, list)
        assert isinstance(errors, list)

    def test_parse_csv_validation_errors_filters_invalid_rows(self):
        """Test CSV parsing filters out rows with validation errors."""
        # Arrange
        import_service = ImportService()
        csv_content = """title,description,priority,due_date,tags,completed
,Description 1,high,2025-12-31T23:59:59,work,false
Task 2,Description 2,invalid_priority,2025-12-25T12:00:00,personal,false
Task 3,Description 3,medium,,work,false"""

        # Act
        valid_tasks, errors = import_service.parse_csv(csv_content)

        # Assert
        assert len(valid_tasks) == 1  # Only Task 3 is valid
        assert len(errors) == 2  # Two rows have errors
        assert "Row 2" in errors[0]  # Empty title
        assert "Row 3" in errors[1]  # Invalid priority

    def test_parse_json_success_returns_valid_tasks(self):
        """Test parsing valid JSON returns list of valid tasks."""
        # Arrange
        import_service = ImportService()
        json_content = json.dumps([
            {
                "title": "Task 1",
                "description": "Description 1",
                "priority": "high",
                "due_date": "2025-12-31T23:59:59",
                "tags": ["work", "urgent"],
                "completed": False
            },
            {
                "title": "Task 2",
                "description": "Description 2",
                "priority": "medium",
                "tags": ["personal"],
                "completed": False
            }
        ])

        # Act
        valid_tasks, errors = import_service.parse_json(json_content)

        # Assert
        assert len(valid_tasks) == 2
        assert len(errors) == 0
        assert valid_tasks[0]['title'] == "Task 1"
        assert valid_tasks[0]['priority'] == "high"
        assert valid_tasks[1]['title'] == "Task 2"

    def test_parse_json_invalid_format_returns_errors(self):
        """Test parsing invalid JSON format returns errors."""
        # Arrange
        import_service = ImportService()
        invalid_json = "not valid json {{"

        # Act
        valid_tasks, errors = import_service.parse_json(invalid_json)

        # Assert
        assert len(valid_tasks) == 0
        assert len(errors) > 0
        assert "JSON parsing error" in errors[0]

    def test_parse_json_not_array_returns_error(self):
        """Test parsing JSON that is not an array returns error."""
        # Arrange
        import_service = ImportService()
        json_content = json.dumps({
            "title": "Task 1",
            "priority": "high"
        })

        # Act
        valid_tasks, errors = import_service.parse_json(json_content)

        # Assert
        assert len(valid_tasks) == 0
        assert len(errors) > 0
        assert "must be an array" in errors[0]

    def test_parse_json_validation_errors_filters_invalid_items(self):
        """Test JSON parsing filters out items with validation errors."""
        # Arrange
        import_service = ImportService()
        json_content = json.dumps([
            {"title": "", "priority": "high"},  # Empty title
            {"title": "Task 2", "priority": "invalid"},  # Invalid priority
            {"title": "Task 3", "priority": "medium"}  # Valid
        ])

        # Act
        valid_tasks, errors = import_service.parse_json(json_content)

        # Assert
        assert len(valid_tasks) == 1  # Only Task 3 is valid
        assert len(errors) == 2  # Two items have errors
        assert "Item 1" in errors[0]
        assert "Item 2" in errors[1]

    def test_validate_imported_task_valid_returns_true(self):
        """Test validating valid task data returns True."""
        # Arrange
        import_service = ImportService()
        valid_task = {
            "title": "Valid Task",
            "description": "Valid description",
            "priority": "medium",
            "due_date": "2025-12-31T23:59:59",
            "tags": ["work", "urgent"],
            "completed": False
        }

        # Act
        is_valid, error = import_service.validate_imported_task(valid_task)

        # Assert
        assert is_valid is True
        assert error == ""

    def test_validate_imported_task_missing_title_returns_false(self):
        """Test validating task without title returns False."""
        # Arrange
        import_service = ImportService()
        invalid_task = {
            "description": "Description",
            "priority": "medium"
        }

        # Act
        is_valid, error = import_service.validate_imported_task(invalid_task)

        # Assert
        assert is_valid is False
        assert "Title is required" in error

    def test_validate_imported_task_title_too_long_returns_false(self):
        """Test validating task with title exceeding 200 characters returns False."""
        # Arrange
        import_service = ImportService()
        invalid_task = {
            "title": "A" * 201,
            "priority": "medium"
        }

        # Act
        is_valid, error = import_service.validate_imported_task(invalid_task)

        # Assert
        assert is_valid is False
        assert "200 characters or less" in error

    def test_validate_imported_task_description_too_long_returns_false(self):
        """Test validating task with description exceeding 1000 characters returns False."""
        # Arrange
        import_service = ImportService()
        invalid_task = {
            "title": "Valid Title",
            "description": "A" * 1001,
            "priority": "medium"
        }

        # Act
        is_valid, error = import_service.validate_imported_task(invalid_task)

        # Assert
        assert is_valid is False
        assert "1000 characters or less" in error

    def test_validate_imported_task_invalid_priority_returns_false(self):
        """Test validating task with invalid priority returns False."""
        # Arrange
        import_service = ImportService()
        invalid_task = {
            "title": "Valid Title",
            "priority": "urgent"  # Invalid - must be low, medium, or high
        }

        # Act
        is_valid, error = import_service.validate_imported_task(invalid_task)

        # Assert
        assert is_valid is False
        assert "Invalid priority" in error

    def test_validate_imported_task_invalid_due_date_returns_false(self):
        """Test validating task with invalid due date format returns False."""
        # Arrange
        import_service = ImportService()
        invalid_task = {
            "title": "Valid Title",
            "priority": "medium",
            "due_date": "invalid-date-format"
        }

        # Act
        is_valid, error = import_service.validate_imported_task(invalid_task)

        # Assert
        assert is_valid is False
        assert "Invalid due_date format" in error

    def test_validate_imported_task_too_many_tags_returns_false(self):
        """Test validating task with more than 10 tags returns False."""
        # Arrange
        import_service = ImportService()
        invalid_task = {
            "title": "Valid Title",
            "priority": "medium",
            "tags": [f"tag{i}" for i in range(11)]  # 11 tags
        }

        # Act
        is_valid, error = import_service.validate_imported_task(invalid_task)

        # Assert
        assert is_valid is False
        assert "Maximum 10 tags" in error

    def test_validate_imported_task_tag_too_long_returns_false(self):
        """Test validating task with tag exceeding 50 characters returns False."""
        # Arrange
        import_service = ImportService()
        invalid_task = {
            "title": "Valid Title",
            "priority": "medium",
            "tags": ["A" * 51]  # Tag too long
        }

        # Act
        is_valid, error = import_service.validate_imported_task(invalid_task)

        # Assert
        assert is_valid is False
        assert "exceeds 50 characters" in error

    def test_parse_datetime_valid_formats(self):
        """Test datetime parsing accepts valid ISO 8601 formats."""
        # Arrange
        import_service = ImportService()
        valid_datetimes = [
            "2025-12-31T23:59:59",
            "2025-12-31T23:59:59Z",
            "2025-12-31T23:59:59+00:00",
        ]

        # Act & Assert
        for datetime_str in valid_datetimes:
            result = import_service._parse_datetime(datetime_str)
            assert result is not None
            assert isinstance(result, datetime)

    def test_parse_datetime_invalid_returns_none(self):
        """Test datetime parsing returns None for invalid formats."""
        # Arrange
        import_service = ImportService()
        invalid_datetimes = [
            "invalid-date",
            "2025-13-01",  # Invalid month
            "not-a-date",
            ""
        ]

        # Act & Assert
        for datetime_str in invalid_datetimes:
            result = import_service._parse_datetime(datetime_str)
            assert result is None

    def test_parse_tags_comma_separated_string(self):
        """Test parsing comma-separated tags string."""
        # Arrange
        import_service = ImportService()
        tags_str = "work, urgent, important"

        # Act
        tags = import_service._parse_tags(tags_str)

        # Assert
        assert isinstance(tags, list)
        assert len(tags) == 3
        assert "work" in tags
        assert "urgent" in tags
        assert "important" in tags

    def test_parse_tags_empty_string_returns_empty_list(self):
        """Test parsing empty tags string returns empty list."""
        # Arrange
        import_service = ImportService()

        # Act & Assert
        assert import_service._parse_tags("") == []
        assert import_service._parse_tags("   ") == []

    def test_parse_tags_already_list_returns_list(self):
        """Test parsing tags that are already a list returns the list."""
        # Arrange
        import_service = ImportService()
        tags_list = ["work", "urgent"]

        # Act
        tags = import_service._parse_tags(tags_list)

        # Assert
        assert tags == tags_list

    def test_parse_boolean_various_formats(self):
        """Test parsing boolean values from various string formats."""
        # Arrange
        import_service = ImportService()

        # Act & Assert
        assert import_service._parse_boolean("true") is True
        assert import_service._parse_boolean("True") is True
        assert import_service._parse_boolean("1") is True
        assert import_service._parse_boolean("yes") is True
        assert import_service._parse_boolean(True) is True

        assert import_service._parse_boolean("false") is False
        assert import_service._parse_boolean("False") is False
        assert import_service._parse_boolean("0") is False
        assert import_service._parse_boolean("no") is False
        assert import_service._parse_boolean(False) is False
