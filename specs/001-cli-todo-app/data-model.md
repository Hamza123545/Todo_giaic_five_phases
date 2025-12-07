# Data Model: Basic CLI Todo App

## Entities

### Task
Represents a single todo item within the application.

- **id**: `int` (Unique identifier for the task, auto-generated).
- **title**: `str` (A brief, mandatory description of the task).
- **description**: `str` (Optional, provides additional details for the task. Defaults to empty string if not provided).
- **is_completed**: `bool` (Indicates the completion status: `True` for complete, `False` for pending. Defaults to `False`).
