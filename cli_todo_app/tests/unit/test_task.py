import pytest
from src.models.task import Task

def test_task_creation():
    task = Task(title="Buy groceries")
    assert task.title == "Buy groceries"
    assert task.description == ""
    assert task.is_completed == False

def test_task_creation_with_description():
    task = Task(title="Read book", description="Finish 'The Martian'")
    assert task.title == "Read book"
    assert task.description == "Finish 'The Martian'"
    assert task.is_completed == False

def test_task_completion():
    task = Task(title="Walk dog", is_completed=True)
    assert task.is_completed == True

def test_task_default_description_is_empty_string():
    task = Task(title="Task with no description")
    assert task.description == ""
