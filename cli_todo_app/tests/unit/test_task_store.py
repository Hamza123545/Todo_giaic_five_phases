import pytest
from src.models.task import Task
from src.services.task_store import TaskStore

def test_add_task(task_store):
    task = task_store.add_task("Buy groceries")
    assert task.id == 1
    assert task.title == "Buy groceries"
    assert task.description == ""
    assert not task.is_completed
    assert len(task_store._tasks) == 1

    task2 = task_store.add_task("Read book", "Finish project documentation")
    assert task2.id == 2
    assert task2.title == "Read book"
    assert task2.description == "Finish project documentation"
    assert not task2.is_completed
    assert len(task_store._tasks) == 2

def test_get_all_tasks(task_store):
    assert task_store.get_all_tasks() == []
    task_store.add_task("Task 1")
    task_store.add_task("Task 2")
    tasks = task_store.get_all_tasks()
    assert len(tasks) == 2
    assert tasks[0].title == "Task 1"
    assert tasks[1].title == "Task 2"

def test_get_task_by_id(task_store):
    task1 = task_store.add_task("Task 1")
    task2 = task_store.add_task("Task 2")

    found_task = task_store.get_task_by_id(task1.id)
    assert found_task == task1

    not_found_task = task_store.get_task_by_id(999)
    assert not_found_task is None

def test_update_task_title(task_store):
    task = task_store.add_task("Original title")
    updated_task = task_store.update_task(task.id, title="New title")
    assert updated_task.title == "New title"
    assert updated_task.description == ""
    assert not updated_task.is_completed

def test_update_task_description(task_store):
    task = task_store.add_task("Title", "Original description")
    updated_task = task_store.update_task(task.id, description="New description")
    assert updated_task.title == "Title"
    assert updated_task.description == "New description"
    assert not updated_task.is_completed

def test_update_task_both_title_and_description(task_store):
    task = task_store.add_task("Title", "Original description")
    updated_task = task_store.update_task(task.id, "Latest title", "Revised description")
    assert updated_task.title == "Latest title"
    assert updated_task.description == "Revised description"
    assert not updated_task.is_completed

def test_update_non_existent_task(task_store):
    updated_task = task_store.update_task(999, title="Non existent")
    assert updated_task is None

def test_mark_complete(task_store):
    task = task_store.add_task("Pending Task")
    completed_task = task_store.mark_complete(task.id)
    assert completed_task.is_completed

def test_mark_complete_non_existent_task(task_store):
    completed_task = task_store.mark_complete(999)
    assert completed_task is None

def test_mark_pending(task_store):
    task = task_store.add_task("Completed Task")
    task_store.mark_complete(task.id)
    pending_task = task_store.mark_pending(task.id)
    assert not pending_task.is_completed

def test_mark_pending_non_existent_task(task_store):
    pending_task = task_store.mark_pending(999)
    assert pending_task is None

def test_delete_task(task_store):
    task = task_store.add_task("Task to delete")
    assert len(task_store._tasks) == 1
    deleted = task_store.delete_task(task.id)
    assert deleted
    assert len(task_store._tasks) == 0
    assert task_store.get_task_by_id(task.id) is None

def test_delete_non_existent_task(task_store):
    task_store.add_task("Existing task")
    assert len(task_store._tasks) == 1
    deleted = task_store.delete_task(999)
    assert not deleted
    assert len(task_store._tasks) == 1
