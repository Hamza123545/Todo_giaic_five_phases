import pytest
from src.services.task_store import TaskStore

@pytest.fixture
def task_store():
    return TaskStore()