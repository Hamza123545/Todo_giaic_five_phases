from click.testing import CliRunner
from src.__main__ import cli
from src.cli.commands import set_task_store
import pytest

@pytest.fixture(autouse=True)
def cli_setup(task_store):
    set_task_store(task_store)

def test_add_command_with_title():
    runner = CliRunner()
    result = runner.invoke(cli, ["add", "Buy groceries"])
    assert "Task added" in result.output
    assert result.exit_code == 0

def test_add_command_with_title_and_description():
    runner = CliRunner()
    result = runner.invoke(cli, ["add", "Read book", "Finish 'The Martian'"])
    assert "Task added" in result.output
    assert result.exit_code == 0

def test_add_command_missing_title():
    runner = CliRunner()
    result = runner.invoke(cli, ["add"])
    assert "Error: Missing argument 'TITLE'" in result.output
    assert result.exit_code != 0

def test_list_command_no_tasks():
    runner = CliRunner()
    result = runner.invoke(cli, ["list"])
    assert "No tasks found." in result.output
    assert result.exit_code == 0

def test_list_command_with_tasks(task_store):
    task_store.add_task("Task 1")
    task_store.add_task("Task 2", "Description 2")
    task_store.mark_complete(1)

    runner = CliRunner()
    result = runner.invoke(cli, ["list"])

    assert "ID    Title     Description         Status" in result.output
    assert "--    ------    ----------------    --------" in result.output
    assert "1     Task 1    (No Description)    Complete" in result.output
    assert "2     Task 2    Description 2       Pending " in result.output
    assert result.exit_code == 0

def test_complete_command_valid_id(task_store):
    task = task_store.add_task("Task to complete")
    runner = CliRunner()
    result = runner.invoke(cli, ["complete", str(task.id)])
    assert "Task 1 marked as complete." in result.output
    assert result.exit_code == 0
    assert task_store.get_task_by_id(task.id).is_completed == True

def test_complete_command_non_existent_id():
    runner = CliRunner()
    result = runner.invoke(cli, ["complete", "999"])
    assert "Error: Task with ID 999 not found." in result.output
    assert result.exit_code != 0

def test_uncomplete_command_valid_id(task_store):
    task = task_store.add_task("Task to uncomplete")
    task_store.mark_complete(task.id)
    assert task_store.get_task_by_id(task.id).is_completed == True
    runner = CliRunner()
    result = runner.invoke(cli, ["uncomplete", str(task.id)])
    assert "Task 1 marked as pending." in result.output
    assert result.exit_code == 0
    assert task_store.get_task_by_id(task.id).is_completed == False

def test_uncomplete_command_non_existent_id():
    runner = CliRunner()
    result = runner.invoke(cli, ["uncomplete", "999"])
    assert "Error: Task with ID 999 not found." in result.output
    assert result.exit_code != 0

def test_update_command_update_title(task_store):
    task = task_store.add_task("Original Title", "Original Description")
    runner = CliRunner()
    result = runner.invoke(cli, ["update", str(task.id), "--title", "Updated Title"])
    assert "Task 1 updated." in result.output
    assert result.exit_code == 0
    updated_task = task_store.get_task_by_id(task.id)
    assert updated_task.title == "Updated Title"
    assert updated_task.description == "Original Description"

def test_update_command_update_description(task_store):
    task = task_store.add_task("Original Title", "Original Description")
    runner = CliRunner()
    result = runner.invoke(cli, ["update", str(task.id), "--description", "Updated Description"])
    assert "Task 1 updated." in result.output
    assert result.exit_code == 0
    updated_task = task_store.get_task_by_id(task.id)
    assert updated_task.title == "Original Title"
    assert updated_task.description == "Updated Description"

def test_update_command_update_title_and_description(task_store):
    task = task_store.add_task("Original Title", "Original Description")
    runner = CliRunner()
    result = runner.invoke(cli, ["update", str(task.id), "--title", "New Title", "--description", "New Description"])
    assert "Task 1 updated." in result.output
    assert result.exit_code == 0
    updated_task = task_store.get_task_by_id(task.id)
    assert updated_task.title == "New Title"
    assert updated_task.description == "New Description"

def test_update_command_non_existent_id():
    runner = CliRunner()
    result = runner.invoke(cli, ["update", "999", "--title", "Non Existent"])
    assert "Error: Task with ID 999 not found." in result.output
    assert result.exit_code != 0

def test_update_command_missing_arguments():
    runner = CliRunner()
    result = runner.invoke(cli, ["update", "1"])
    assert "Error: Missing arguments for update. Provide --title or --description." in result.output
    assert result.exit_code != 0

def test_delete_command_valid_id(task_store):
    task_store.add_task("Task to delete")
    runner = CliRunner()
    result = runner.invoke(cli, ["delete", "1"])
    assert "Task 1 deleted." in result.output
    assert result.exit_code == 0
    assert len(task_store.get_all_tasks()) == 0

def test_delete_command_non_existent_id():
    runner = CliRunner()
    result = runner.invoke(cli, ["delete", "999"])
    assert "Error: Task with ID 999 not found." in result.output
    assert result.exit_code != 0

# Security tests for FR-009 Input Sanitization
def test_add_task_with_shell_metacharacters_dollar():
    """Test that shell metacharacters (dollar sign) are rejected."""
    runner = CliRunner()
    result = runner.invoke(cli, ["add", "Task with $variable"])
    assert result.exit_code == 1
    assert "Error:" in result.output
    assert "disallowed characters" in result.output

def test_add_task_with_shell_metacharacters_backtick():
    """Test that shell metacharacters (backtick) are rejected."""
    runner = CliRunner()
    result = runner.invoke(cli, ["add", "Task with `command`"])
    assert result.exit_code == 1
    assert "Error:" in result.output
    assert "disallowed characters" in result.output

def test_add_task_with_shell_metacharacters_semicolon():
    """Test that shell metacharacters (semicolon) are rejected."""
    runner = CliRunner()
    result = runner.invoke(cli, ["add", "Task; rm -rf /"])
    assert result.exit_code == 1
    assert "Error:" in result.output
    assert "disallowed characters" in result.output

def test_add_task_with_shell_metacharacters_pipe():
    """Test that shell metacharacters (pipe) are rejected."""
    runner = CliRunner()
    result = runner.invoke(cli, ["add", "Task | grep something"])
    assert result.exit_code == 1
    assert "Error:" in result.output
    assert "disallowed characters" in result.output

def test_add_task_with_control_characters():
    """Test that control characters are rejected."""
    runner = CliRunner()
    result = runner.invoke(cli, ["add", "Task with \x00 null"])
    assert result.exit_code == 1
    assert "Error:" in result.output
    assert "control character" in result.output

def test_update_task_with_malicious_title(task_store):
    """Test that update command rejects malicious titles."""
    task = task_store.add_task("Safe task")
    runner = CliRunner()
    result = runner.invoke(cli, ["update", str(task.id), "--title", "Task && rm -rf /"])
    assert result.exit_code == 1
    assert "Error:" in result.output
    assert "disallowed characters" in result.output

def test_update_task_with_malicious_description(task_store):
    """Test that update command rejects malicious descriptions."""
    task = task_store.add_task("Safe task")
    runner = CliRunner()
    result = runner.invoke(cli, ["update", str(task.id), "--description", "Description; echo hacked"])
    assert result.exit_code == 1
    assert "Error:" in result.output
    assert "disallowed characters" in result.output

def test_add_task_exceeds_max_length():
    """Test that excessively long input is rejected."""
    runner = CliRunner()
    long_title = "A" * 501
    result = runner.invoke(cli, ["add", long_title])
    assert result.exit_code == 1
    assert "Error:" in result.output
    assert "exceeds maximum length" in result.output

