"""
Unit tests for ExportImportService.

This module tests export and import functionality for tasks in CSV and JSON formats.
"""

import csv
import io
import json
from datetime import datetime
from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlmodel import Session, select

from models import Task
from services.export_import_service import ExportImportService


class TestExportTasksCSV:
    """Tests for ExportImportService.export_tasks_csv method."""

    def test_export_csv_empty_list_returns_header_only(self):
        """Test exporting empty task list returns CSV with header only."""
        # Arrange
        tasks = []

        # Act
        result = ExportImportService.export_tasks_csv(tasks)

        # Assert
        lines = result.strip().split("\n")
        assert len(lines) == 1  # Only header
        assert "id,title,description,completed,priority,due_date,tags,created_at,updated_at" in lines[0]

    def test_export_csv_single_task_returns_correct_format(self):
        """Test exporting single task returns properly formatted CSV."""
        # Arrange
        user_id = uuid4()
        task = Task(
            id=1,
            user_id=user_id,
            title="Test Task",
            description="Test Description",
            priority="high",
            due_date=datetime(2024, 12, 31),
            tags=["work", "urgent"],
            completed=False,
            created_at=datetime(2024, 1, 1),
            updated_at=datetime(2024, 1, 2),
        )

        # Act
        result = ExportImportService.export_tasks_csv([task])

        # Assert
        lines = result.strip().split("\n")
        assert len(lines) == 2  # Header + 1 task
        assert "Test Task" in lines[1]
        assert "Test Description" in lines[1]
        assert "high" in lines[1]
        assert "work,urgent" in lines[1]

    def test_export_csv_multiple_tasks_returns_all_rows(self):
        """Test exporting multiple tasks returns all task rows."""
        # Arrange
        user_id = uuid4()
        tasks = [
            Task(
                id=i,
                user_id=user_id,
                title=f"Task {i}",
                description=f"Description {i}",
                priority="medium",
                completed=False,
                created_at=datetime.now(),
                updated_at=datetime.now(),
            )
            for i in range(5)
        ]

        # Act
        result = ExportImportService.export_tasks_csv(tasks)

        # Assert
        lines = result.strip().split("\n")
        assert len(lines) == 6  # Header + 5 tasks

    def test_export_csv_task_without_optional_fields_uses_empty_strings(self):
        """Test exporting task without optional fields uses empty strings."""
        # Arrange
        user_id = uuid4()
        task = Task(
            id=1,
            user_id=user_id,
            title="Minimal Task",
            priority="medium",
            completed=False,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        # Act
        result = ExportImportService.export_tasks_csv([task])

        # Assert
        reader = csv.DictReader(io.StringIO(result))
        row = next(reader)
        assert row["description"] == ""
        assert row["due_date"] == ""
        assert row["tags"] == ""

    def test_export_csv_task_with_tags_formats_as_comma_separated(self):
        """Test exporting task with tags formats them as comma-separated list."""
        # Arrange
        user_id = uuid4()
        task = Task(
            id=1,
            user_id=user_id,
            title="Tagged Task",
            tags=["python", "backend", "testing"],
            priority="medium",
            completed=False,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        # Act
        result = ExportImportService.export_tasks_csv([task])

        # Assert
        assert "python,backend,testing" in result


class TestExportTasksJSON:
    """Tests for ExportImportService.export_tasks_json method."""

    def test_export_json_empty_list_returns_empty_array(self):
        """Test exporting empty task list returns empty JSON array."""
        # Arrange
        tasks = []

        # Act
        result = ExportImportService.export_tasks_json(tasks)

        # Assert
        parsed = json.loads(result)
        assert parsed == []

    def test_export_json_single_task_returns_valid_json(self):
        """Test exporting single task returns valid JSON."""
        # Arrange
        user_id = uuid4()
        task = Task(
            id=1,
            user_id=user_id,
            title="JSON Task",
            description="JSON Description",
            priority="low",
            due_date=datetime(2024, 12, 31),
            tags=["test"],
            completed=True,
            created_at=datetime(2024, 1, 1),
            updated_at=datetime(2024, 1, 2),
        )

        # Act
        result = ExportImportService.export_tasks_json([task])

        # Assert
        parsed = json.loads(result)
        assert len(parsed) == 1
        assert parsed[0]["title"] == "JSON Task"
        assert parsed[0]["description"] == "JSON Description"
        assert parsed[0]["priority"] == "low"
        assert parsed[0]["completed"] is True
        assert parsed[0]["tags"] == ["test"]

    def test_export_json_task_without_optional_fields_uses_null(self):
        """Test exporting task without optional fields uses null."""
        # Arrange
        user_id = uuid4()
        task = Task(
            id=1,
            user_id=user_id,
            title="Minimal Task",
            priority="medium",
            completed=False,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        # Act
        result = ExportImportService.export_tasks_json([task])

        # Assert
        parsed = json.loads(result)
        assert parsed[0]["description"] is None
        assert parsed[0]["due_date"] is None
        assert parsed[0]["tags"] is None

    def test_export_json_multiple_tasks_returns_array(self):
        """Test exporting multiple tasks returns JSON array."""
        # Arrange
        user_id = uuid4()
        tasks = [
            Task(
                id=i,
                user_id=user_id,
                title=f"Task {i}",
                priority="medium",
                completed=False,
                created_at=datetime.now(),
                updated_at=datetime.now(),
            )
            for i in range(3)
        ]

        # Act
        result = ExportImportService.export_tasks_json(tasks)

        # Assert
        parsed = json.loads(result)
        assert len(parsed) == 3


class TestImportTasksCSV:
    """Tests for ExportImportService.import_tasks_csv method."""

    def test_import_csv_valid_data_creates_tasks(self, session: Session):
        """Test importing valid CSV creates tasks in database."""
        # Arrange
        user_id = uuid4()
        csv_content = """title,description,priority,due_date,tags,completed
Task 1,Description 1,high,2024-12-31T23:59:59,work,false
Task 2,Description 2,medium,,personal,true"""

        # Act
        result = ExportImportService.import_tasks_csv(session, user_id, csv_content)

        # Assert
        assert result["imported"] == 2
        assert result["failed"] == 0

        # Verify tasks in database
        tasks = session.exec(select(Task).where(Task.user_id == user_id)).all()
        assert len(tasks) == 2

    def test_import_csv_missing_title_reports_error(self, session: Session):
        """Test importing CSV with missing title reports error."""
        # Arrange
        user_id = uuid4()
        csv_content = """title,description,priority
,Description,medium"""

        # Act
        result = ExportImportService.import_tasks_csv(session, user_id, csv_content)

        # Assert
        assert result["imported"] == 0
        assert result["failed"] == 1
        assert len(result["errors"]) > 0
        assert "Missing required field 'title'" in result["errors"][0]

    def test_import_csv_invalid_priority_reports_error(self, session: Session):
        """Test importing CSV with invalid priority reports error."""
        # Arrange
        user_id = uuid4()
        csv_content = """title,priority
Valid Task,invalid_priority"""

        # Act
        result = ExportImportService.import_tasks_csv(session, user_id, csv_content)

        # Assert
        assert result["failed"] == 1
        assert any("Invalid priority" in error for error in result["errors"])

    def test_import_csv_invalid_date_format_reports_error(self, session: Session):
        """Test importing CSV with invalid date format reports error."""
        # Arrange
        user_id = uuid4()
        csv_content = """title,due_date
Task With Bad Date,not-a-date"""

        # Act
        result = ExportImportService.import_tasks_csv(session, user_id, csv_content)

        # Assert
        assert result["failed"] == 1
        assert any("Invalid due_date format" in error for error in result["errors"])

    def test_import_csv_tags_parsed_correctly(self, session: Session):
        """Test importing CSV parses tags correctly."""
        # Arrange
        user_id = uuid4()
        csv_content = """title,tags
Tagged Task,"python,testing,backend" """

        # Act
        result = ExportImportService.import_tasks_csv(session, user_id, csv_content)

        # Assert
        assert result["imported"] == 1
        task = session.exec(select(Task).where(Task.user_id == user_id)).first()
        assert task.tags == ["python", "testing", "backend"]

    def test_import_csv_completed_field_parsed_correctly(self, session: Session):
        """Test importing CSV parses completed field correctly."""
        # Arrange
        user_id = uuid4()
        csv_content = """title,completed
Completed Task,true
Pending Task,false
Yes Task,yes
One Task,1"""

        # Act
        result = ExportImportService.import_tasks_csv(session, user_id, csv_content)

        # Assert
        assert result["imported"] == 4
        tasks = session.exec(select(Task).where(Task.user_id == user_id)).all()
        assert tasks[0].completed is True
        assert tasks[1].completed is False
        assert tasks[2].completed is True
        assert tasks[3].completed is True

    def test_import_csv_invalid_format_raises_http_exception(self, session: Session):
        """Test importing invalid CSV format raises HTTPException."""
        # Arrange
        user_id = uuid4()
        invalid_csv = "This is not CSV content\nwithout proper structure"

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            ExportImportService.import_tasks_csv(session, user_id, invalid_csv)

        assert exc_info.value.status_code == 400

    def test_import_csv_partial_success_reports_both_counts(self, session: Session):
        """Test importing CSV with partial success reports both imported and failed."""
        # Arrange
        user_id = uuid4()
        csv_content = """title,priority
Valid Task,high
,medium
Another Valid,low"""

        # Act
        result = ExportImportService.import_tasks_csv(session, user_id, csv_content)

        # Assert
        assert result["imported"] == 2
        assert result["failed"] == 1


class TestImportTasksJSON:
    """Tests for ExportImportService.import_tasks_json method."""

    def test_import_json_valid_data_creates_tasks(self, session: Session):
        """Test importing valid JSON creates tasks in database."""
        # Arrange
        user_id = uuid4()
        json_content = json.dumps([
            {
                "title": "JSON Task 1",
                "description": "Description 1",
                "priority": "high",
                "completed": False,
                "tags": ["work"],
            },
            {
                "title": "JSON Task 2",
                "priority": "medium",
                "completed": True,
            },
        ])

        # Act
        result = ExportImportService.import_tasks_json(session, user_id, json_content)

        # Assert
        assert result["imported"] == 2
        assert result["failed"] == 0

        tasks = session.exec(select(Task).where(Task.user_id == user_id)).all()
        assert len(tasks) == 2

    def test_import_json_missing_title_reports_error(self, session: Session):
        """Test importing JSON with missing title reports error."""
        # Arrange
        user_id = uuid4()
        json_content = json.dumps([{"description": "No title", "priority": "low"}])

        # Act
        result = ExportImportService.import_tasks_json(session, user_id, json_content)

        # Assert
        assert result["failed"] == 1
        assert any("Missing required field 'title'" in error for error in result["errors"])

    def test_import_json_not_array_raises_http_exception(self, session: Session):
        """Test importing JSON that's not an array raises HTTPException."""
        # Arrange
        user_id = uuid4()
        json_content = json.dumps({"single": "object"})

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            ExportImportService.import_tasks_json(session, user_id, json_content)

        assert exc_info.value.status_code == 400
        assert "must be an array" in str(exc_info.value.detail)

    def test_import_json_invalid_json_raises_http_exception(self, session: Session):
        """Test importing invalid JSON raises HTTPException."""
        # Arrange
        user_id = uuid4()
        invalid_json = "{ not valid json }"

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            ExportImportService.import_tasks_json(session, user_id, invalid_json)

        assert exc_info.value.status_code == 400

    def test_import_json_invalid_priority_reports_error(self, session: Session):
        """Test importing JSON with invalid priority reports error."""
        # Arrange
        user_id = uuid4()
        json_content = json.dumps([{"title": "Task", "priority": "invalid"}])

        # Act
        result = ExportImportService.import_tasks_json(session, user_id, json_content)

        # Assert
        assert result["failed"] == 1
        assert any("Invalid priority" in error for error in result["errors"])

    def test_import_json_tags_not_array_reports_error(self, session: Session):
        """Test importing JSON with tags not as array reports error."""
        # Arrange
        user_id = uuid4()
        json_content = json.dumps([{"title": "Task", "tags": "not-an-array"}])

        # Act
        result = ExportImportService.import_tasks_json(session, user_id, json_content)

        # Assert
        assert result["failed"] == 1
        assert any("Tags must be an array" in error for error in result["errors"])

    def test_import_json_with_due_date_parses_correctly(self, session: Session):
        """Test importing JSON with due_date parses correctly."""
        # Arrange
        user_id = uuid4()
        due_date = "2024-12-31T23:59:59"
        json_content = json.dumps([{"title": "Task", "due_date": due_date}])

        # Act
        result = ExportImportService.import_tasks_json(session, user_id, json_content)

        # Assert
        assert result["imported"] == 1
        task = session.exec(select(Task).where(Task.user_id == user_id)).first()
        assert task.due_date == datetime.fromisoformat(due_date)

    def test_import_json_limits_error_list_to_ten(self, session: Session):
        """Test importing JSON limits error list to first 10 errors."""
        # Arrange
        user_id = uuid4()
        # Create 15 invalid tasks (missing title)
        tasks = [{"description": f"Task {i}"} for i in range(15)]
        json_content = json.dumps(tasks)

        # Act
        result = ExportImportService.import_tasks_json(session, user_id, json_content)

        # Assert
        assert result["failed"] == 15
        assert result["total_errors"] == 15
        assert len(result["errors"]) == 10  # Limited to first 10


class TestExportImportRoundTrip:
    """Tests for export/import round-trip functionality."""

    def test_csv_export_import_roundtrip_preserves_data(self, session: Session):
        """Test exporting and re-importing CSV preserves data."""
        # Arrange
        user_id = uuid4()
        original_tasks = [
            Task(
                id=1,
                user_id=user_id,
                title="Task 1",
                description="Description 1",
                priority="high",
                tags=["work"],
                completed=False,
                created_at=datetime.now(),
                updated_at=datetime.now(),
            ),
            Task(
                id=2,
                user_id=user_id,
                title="Task 2",
                priority="low",
                completed=True,
                created_at=datetime.now(),
                updated_at=datetime.now(),
            ),
        ]

        # Act - Export
        csv_content = ExportImportService.export_tasks_csv(original_tasks)

        # Import to new user
        new_user_id = uuid4()
        result = ExportImportService.import_tasks_csv(session, new_user_id, csv_content)

        # Assert
        assert result["imported"] == 2
        imported_tasks = session.exec(select(Task).where(Task.user_id == new_user_id)).all()
        assert len(imported_tasks) == 2
        assert imported_tasks[0].title == "Task 1"
        assert imported_tasks[0].priority == "high"
        assert imported_tasks[1].completed is True

    def test_json_export_import_roundtrip_preserves_data(self, session: Session):
        """Test exporting and re-importing JSON preserves data."""
        # Arrange
        user_id = uuid4()
        original_tasks = [
            Task(
                id=1,
                user_id=user_id,
                title="JSON Task",
                description="JSON Desc",
                priority="medium",
                tags=["python", "test"],
                completed=False,
                created_at=datetime.now(),
                updated_at=datetime.now(),
            )
        ]

        # Act - Export
        json_content = ExportImportService.export_tasks_json(original_tasks)

        # Import to new user
        new_user_id = uuid4()
        result = ExportImportService.import_tasks_json(session, new_user_id, json_content)

        # Assert
        assert result["imported"] == 1
        imported_task = session.exec(select(Task).where(Task.user_id == new_user_id)).first()
        assert imported_task.title == "JSON Task"
        assert imported_task.tags == ["python", "test"]
