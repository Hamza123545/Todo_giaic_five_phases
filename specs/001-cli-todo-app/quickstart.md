# Quickstart: Basic CLI Todo App

This guide provides instructions to set up, run, and test the Basic CLI Todo Application.

## Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd todo_console_app/todo_console
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

To run the CLI application:

```bash
python -m src cli [command] [args]
```

Example commands:
-   Add a task: `python -m src cli add "Buy groceries"`
-   List tasks: `python -m src cli list`
-   Complete a task: `python -m src cli complete 1`

## Running Tests

To run the automated tests:

```bash
uv run pytest
```