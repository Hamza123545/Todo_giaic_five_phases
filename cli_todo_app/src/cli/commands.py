import click
from typing import Optional
from src.services.task_store import TaskStore

# Try to import sanitize_input, use passthrough if not available
try:
    from src.utils.input_sanitizer import sanitize_input
except ImportError:
    def sanitize_input(text):
        """Passthrough if sanitizer not available."""
        if text is None:
            return None
        return str(text).strip() if text else None

GLOBAL_TASK_STORE: Optional[TaskStore] = None

def set_task_store(store: TaskStore):
    global GLOBAL_TASK_STORE
    GLOBAL_TASK_STORE = store

@click.group()
def cli():
    """A simple CLI for managing todo tasks."""
    pass

@cli.command()
@click.argument('title')
@click.argument('description', required=False)
def add(title: str, description: str):
    """Adds a new todo task."""
    try:
        sanitized_title = sanitize_input(title)
        sanitized_description = sanitize_input(description) if description else None
        task = GLOBAL_TASK_STORE.add_task(sanitized_title, sanitized_description)
        click.echo(f"Task added: {task.title} (ID: {task.id})")
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)

@cli.command()
def list():
    """Lists all todo tasks."""
    tasks = GLOBAL_TASK_STORE.get_all_tasks()
    if not tasks:
        click.echo("No tasks found.")
        return

    # CLI-UX pattern for tabular output
    headers = ["ID", "Title", "Description", "Status"]
    data = []
    for task in tasks:
        status = "Complete" if task.is_completed else "Pending"
        description = task.description if task.description else "(No Description)"
        data.append([str(task.id), task.title, description, status])

    # Calculate column widths
    col_widths = [max(len(str(item)) for item in col) for col in zip(*([headers] + data))]

    # Print headers
    header_line = "    ".join(f"{header:<{col_widths[i]}}" for i, header in enumerate(headers))
    click.echo(header_line)
    click.echo("    ".join(['-' * width for width in col_widths]))

    # Print data
    for row in data:
        data_line = "    ".join(f"{item:<{col_widths[i]}}" for i, item in enumerate(row))
        click.echo(data_line)

@cli.command()
@click.argument('task_id', type=int)
def complete(task_id: int):
    """Marks a task as complete."""
    task = GLOBAL_TASK_STORE.mark_complete(task_id)
    if task:
        click.echo(f"Task {task_id} marked as complete.")
    else:
        click.echo(f"Error: Task with ID {task_id} not found.", err=True)

@cli.command()
@click.argument('task_id', type=int)
def uncomplete(task_id: int):
    """Marks a task as pending."""
    task = GLOBAL_TASK_STORE.mark_pending(task_id)
    if task:
        click.echo(f"Task {task_id} marked as pending.")
    else:
        click.echo(f"Error: Task with ID {task_id} not found.", err=True)

@cli.command()
@click.argument('task_id', type=int)
@click.option('--title', '-t', help='New title for the task')
@click.option('--description', '-d', help='New description for the task')
def update(task_id: int, title: str, description: str):
    """Updates an existing task's title or description."""
    if not title and not description:
        click.echo("Error: Missing arguments for update. Provide --title or --description.", err=True)
        return

    try:
        sanitized_title = sanitize_input(title) if title else None
        sanitized_description = sanitize_input(description) if description else None
        task = GLOBAL_TASK_STORE.update_task(task_id, sanitized_title, sanitized_description)
        if task:
            click.echo(f"Task {task_id} updated.")
        else:
            click.echo(f"Error: Task with ID {task_id} not found.", err=True)
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)

@cli.command()
@click.argument('task_id', type=int)
def delete(task_id: int):
    """Deletes a task."""
    deleted = GLOBAL_TASK_STORE.delete_task(task_id)
    if deleted:
        click.echo(f"Task {task_id} deleted.")
    else:
        click.echo(f"Error: Task with ID {task_id} not found.", err=True)



