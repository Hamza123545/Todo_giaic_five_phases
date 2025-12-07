import shlex
import sys
from src.cli.commands import cli, set_task_store
from src.services.task_store import TaskStore
import click

def run_interactive_mode():
    """Run the CLI in interactive mode with a persistent task store."""
    task_store_instance = TaskStore()
    set_task_store(task_store_instance)

    # Display welcome message
    click.echo("=" * 60)
    click.echo("Welcome to the Interactive Todo CLI!")
    click.echo("Type 'help' for available commands or 'exit'/'quit' to quit.")
    click.echo("=" * 60)
    click.echo()

    while True:
        try:
            # Get user input
            user_input = input("> ").strip()

            # Handle empty input
            if not user_input:
                continue

            # Parse the input to extract command and arguments
            try:
                parts = shlex.split(user_input)
            except ValueError as e:
                click.echo(f"Error parsing input: {e}", err=True)
                continue

            command = parts[0].lower()

            # Check for exit commands
            if command in ['exit', 'quit']:
                click.echo("Goodbye!")
                break

            # Handle help command
            if command == 'help':
                click.echo("\nAvailable commands:")
                click.echo("  add <title> [description]       - Add a new task")
                click.echo("  list                            - List all tasks")
                click.echo("  complete <task_id>              - Mark a task as complete")
                click.echo("  uncomplete <task_id>            - Mark a task as pending")
                click.echo("  update <task_id> [options]      - Update a task")
                click.echo("    Options:")
                click.echo("      --title <title> or -t <title>")
                click.echo("      --description <desc> or -d <desc>")
                click.echo("  delete <task_id>                - Delete a task")
                click.echo("  help                            - Show this help message")
                click.echo("  exit or quit                    - Exit the application")
                click.echo()
                continue

            # Invoke the Click command with parsed arguments
            try:
                # Use standalone mode to prevent sys.exit() from killing the loop
                cli.main(parts, standalone_mode=False)
            except click.exceptions.ClickException as e:
                e.show()
            except click.exceptions.Abort:
                click.echo("Command aborted.")
            except SystemExit:
                # Catch any sys.exit() calls and continue the loop
                pass
            except Exception as e:
                click.echo(f"Error executing command: {e}", err=True)

            # Add blank line for readability
            click.echo()

        except KeyboardInterrupt:
            # Handle Ctrl+C gracefully
            click.echo("\n\nUse 'exit' or 'quit' to quit the application.")
            click.echo()
        except EOFError:
            # Handle Ctrl+D / EOF gracefully
            click.echo("\nGoodbye!")
            break

if __name__ == "__main__":
    run_interactive_mode()