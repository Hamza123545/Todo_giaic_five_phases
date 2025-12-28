"""
Export/Import service for tasks.

This module provides functionality to export tasks to CSV/JSON/PDF and import from CSV/JSON.
"""

import csv
import io
import json
from datetime import datetime
from typing import List
# Removed UUID import - Better Auth uses string IDs

from fastapi import HTTPException, status
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER
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
    def export_tasks_pdf(tasks: List[Task]) -> bytes:
        """
        Export tasks to PDF format with professional layout.

        Args:
            tasks: List of tasks to export

        Returns:
            bytes: PDF file content as bytes

        The PDF includes:
        - Professional header with title and export timestamp
        - Table with task details (Title, Description, Priority, Due Date, Status, Tags)
        - Proper formatting and styling
        - Page numbers and footer
        """
        # Create a bytes buffer for the PDF
        buffer = io.BytesIO()

        # Create the PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.75 * inch,
            leftMargin=0.75 * inch,
            topMargin=1 * inch,
            bottomMargin=0.75 * inch,
        )

        # Container for the PDF elements
        elements = []

        # Get styles
        styles = getSampleStyleSheet()

        # Create custom title style
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=30,
            alignment=TA_CENTER,
        )

        # Create custom subtitle style
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#666666'),
            spaceAfter=20,
            alignment=TA_CENTER,
        )

        # Add title
        title = Paragraph("Task Export Report", title_style)
        elements.append(title)

        # Add export timestamp
        export_time = datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')
        subtitle = Paragraph(f"Exported on {export_time}", subtitle_style)
        elements.append(subtitle)
        elements.append(Spacer(1, 0.3 * inch))

        # Add summary statistics
        total_tasks = len(tasks)
        completed_tasks = sum(1 for task in tasks if task.completed)
        pending_tasks = total_tasks - completed_tasks

        summary_style = ParagraphStyle(
            'Summary',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#333333'),
            spaceAfter=20,
        )

        summary_text = f"<b>Summary:</b> {total_tasks} total tasks ({completed_tasks} completed, {pending_tasks} pending)"
        summary = Paragraph(summary_text, summary_style)
        elements.append(summary)
        elements.append(Spacer(1, 0.2 * inch))

        if not tasks:
            # No tasks to export
            no_tasks_style = ParagraphStyle(
                'NoTasks',
                parent=styles['Normal'],
                fontSize=12,
                textColor=colors.HexColor('#999999'),
                alignment=TA_CENTER,
            )
            no_tasks = Paragraph("No tasks to display", no_tasks_style)
            elements.append(no_tasks)
        else:
            # Create table data
            table_data = []

            # Add table headers
            headers = ['Title', 'Description', 'Priority', 'Due Date', 'Status', 'Tags']
            table_data.append(headers)

            # Add task rows
            for task in tasks:
                # Format due date
                due_date_str = task.due_date.strftime('%Y-%m-%d') if task.due_date else 'N/A'

                # Format status
                status_str = 'Completed' if task.completed else 'Pending'

                # Format tags
                tags_str = ', '.join(task.tags) if task.tags else 'None'

                # Format description (truncate if too long)
                description = task.description or 'N/A'
                if len(description) > 50:
                    description = description[:47] + '...'

                # Format title (truncate if too long)
                title_text = task.title
                if len(title_text) > 30:
                    title_text = title_text[:27] + '...'

                row = [
                    title_text,
                    description,
                    task.priority.capitalize(),
                    due_date_str,
                    status_str,
                    tags_str,
                ]
                table_data.append(row)

            # Create the table with column widths
            col_widths = [1.5 * inch, 1.8 * inch, 0.8 * inch, 1 * inch, 0.9 * inch, 1 * inch]
            table = Table(table_data, colWidths=col_widths, repeatRows=1)

            # Style the table
            table_style = TableStyle([
                # Header styling
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4a5568')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('TOPPADDING', (0, 0), (-1, 0), 12),

                # Body styling
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#1a1a1a')),
                ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('TOPPADDING', (0, 1), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),

                # Grid styling
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
                ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#2d3748')),

                # Alternating row colors for better readability
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')]),

                # Vertical alignment
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ])

            table.setStyle(table_style)
            elements.append(table)

        # Add footer with page numbers
        def add_page_number(canvas, doc):
            """Add page number to footer."""
            page_num = canvas.getPageNumber()
            text = f"Page {page_num}"
            canvas.saveState()
            canvas.setFont('Helvetica', 9)
            canvas.setFillColor(colors.HexColor('#666666'))
            canvas.drawCentredString(4.25 * inch, 0.5 * inch, text)
            canvas.restoreState()

        # Build the PDF
        doc.build(elements, onFirstPage=add_page_number, onLaterPages=add_page_number)

        # Get the PDF content
        pdf_content = buffer.getvalue()
        buffer.close()

        return pdf_content

    @staticmethod
    def import_tasks_csv(db: Session, user_id: str, csv_content: str) -> dict:
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
            try:
                reader = csv.DictReader(csv_file)
                # Check if CSV has required headers
                if not reader.fieldnames:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail={
                            "success": False,
                            "error": {"code": "VALIDATION_ERROR", "message": "CSV file is missing headers"},
                        },
                    )
                # Check for required 'title' field in headers
                if "title" not in reader.fieldnames:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail={
                            "success": False,
                            "error": {"code": "VALIDATION_ERROR", "message": "CSV file is missing required 'title' column"},
                        },
                    )
                # Try to read first row to validate CSV format
                first_row = next(reader, None)
                if first_row is None:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail={
                            "success": False,
                            "error": {"code": "VALIDATION_ERROR", "message": "CSV file is empty or has no data rows"},
                        },
                    )
                # Reset to beginning
                csv_file.seek(0)
                reader = csv.DictReader(csv_file)
            except HTTPException:
                raise
            except (csv.Error, StopIteration, ValueError) as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "success": False,
                        "error": {"code": "VALIDATION_ERROR", "message": f"Invalid CSV format: {str(e)}"},
                    },
                )

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

        except HTTPException:
            raise
        except csv.Error as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {"code": "VALIDATION_ERROR", "message": f"Invalid CSV format: {str(e)}"},
                },
            )
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {"code": "IMPORT_ERROR", "message": f"Import failed: {str(e)}"},
                },
            )

    @staticmethod
    def import_tasks_json(db: Session, user_id: str, json_content: str) -> dict:
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
                    detail={
                        "success": False,
                        "error": {"code": "VALIDATION_ERROR", "message": "JSON must be an array of task objects"},
                    },
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

        except HTTPException:
            raise
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {"code": "VALIDATION_ERROR", "message": f"Invalid JSON format: {str(e)}"},
                },
            )
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {"code": "IMPORT_ERROR", "message": f"Import failed: {str(e)}"},
                },
            )
