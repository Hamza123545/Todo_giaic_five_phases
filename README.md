# Todo GIAIC Five Phases - CLI Todo App

This is a simple command-line interface (CLI) application for managing todo tasks. It allows users to add, list, update, complete/uncomplete, and delete tasks.

## Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Hamza123545/Todo_giaic_five_phases.git
    cd Todo_giaic_five_phases/cli_todo_app
    ```

2.  **Install UV**:
    If you don't have UV installed, follow the instructions on the official UV website: `https://github.com/astral-sh/uv`

3.  **Create and activate a virtual environment**:
    ```bash
    uv venv
    source .venv/bin/activate  # On Windows: .venv\Scripts\activate
    ```

4.  **Install dependencies**:
    ```bash
    uv pip install -e .
    ```
    (Note: Assuming `pyproject.toml` or `setup.py` will be configured for editable install)

## Running the Application

**Note:** All commands must be run from the `cli_todo_app/` directory.

```bash
cd cli_todo_app
```

### Interactive Mode (Recommended)

The application now runs in **interactive mode** by default, allowing you to execute multiple commands in a single session:

```bash
# Start the interactive CLI
uv run python -m src

# Or use the installed entry point
todo
```

**Example session:**
```
> add "Buy groceries"
Task added: Buy groceries (ID: 1)

> list
ID    Title            Description         Status
--    -------------    ----------------    -------
1     Buy groceries    (No Description)    Pending

> complete 1
Task 1 marked as complete.

> add "Read book" "Finish The Martian"
Task added: Read book (ID: 2)

> list
ID    Title            Description           Status
--    -------------    ------------------    --------
1     Buy groceries    (No Description)      Complete
2     Read book        Finish The Martian    Pending

> exit
Goodbye!
```

**Interactive Mode Commands:**
- `add <title> [description]` - Add a new task
- `list` - List all tasks
- `complete <task_id>` - Mark a task as complete
- `uncomplete <task_id>` - Mark a task as pending
- `update <task_id> --title <title>` - Update task title
- `update <task_id> --description <desc>` - Update task description
- `delete <task_id>` - Delete a task
- `help` - Show available commands
- `exit` or `quit` - Exit the application

**Features:**
- Persistent task storage during the session
- Ctrl+C gracefully handled (won't exit the app)
- Ctrl+D / EOF exits the application
- All existing commands work exactly the same way

## Running Tests

To run the automated tests from the `cli_todo_app/` directory:

```bash
cd cli_todo_app
uv run pytest
```
