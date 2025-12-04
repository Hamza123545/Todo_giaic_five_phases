from typing import List, Optional
from src.models.task import Task

class TaskStore:
    def __init__(self):
        """Initializes the TaskStore with an empty list of tasks and sets the next available ID."""
        self._tasks: List[Task] = []
        self._next_id: int = 1

    def add_task(self, title: str, description: Optional[str] = None) -> Task:
        """Adds a new task to the store.

        Args:
            title (str): The title of the task.
            description (Optional[str]): The optional description of the task.

        Returns:
            Task: The newly created task.
        """
        task = Task(title=title, description=description)
        task.id = self._next_id
        self._next_id += 1
        self._tasks.append(task)
        return task

    def get_all_tasks(self) -> List[Task]:
        """Retrieves all tasks currently in the store.

        Returns:
            List[Task]: A list of all tasks.
        """
        return self._tasks

    def get_task_by_id(self, task_id: int) -> Optional[Task]:
        """Retrieves a task by its unique ID.

        Args:
            task_id (int): The ID of the task to retrieve.

        Returns:
            Optional[Task]: The task if found, otherwise None.
        """
        return next((task for task in self._tasks if task.id == task_id), None)

    def update_task(self, task_id: int, title: Optional[str] = None, description: Optional[str] = None) -> Optional[Task]:
        """Updates the title or description of an existing task.

        Args:
            task_id (int): The ID of the task to update.
            title (Optional[str]): The new title for the task (if provided).
            description (Optional[str]): The new description for the task (if provided).

        Returns:
            Optional[Task]: The updated task if found, otherwise None.
        """
        task = self.get_task_by_id(task_id)
        if task:
            if title is not None:
                task.title = title
            if description is not None:
                task.description = description
        return task

    def mark_complete(self, task_id: int) -> Optional[Task]:
        """Marks a task as complete.

        Args:
            task_id (int): The ID of the task to mark as complete.

        Returns:
            Optional[Task]: The updated task if found, otherwise None.
        """
        task = self.get_task_by_id(task_id)
        if task:
            task.is_completed = True
        return task

    def mark_pending(self, task_id: int) -> Optional[Task]:
        """Marks a task as pending.

        Args:
            task_id (int): The ID of the task to mark as pending.

        Returns:
            Optional[Task]: The updated task if found, otherwise None.
        """
        task = self.get_task_by_id(task_id)
        if task:
            task.is_completed = False
        return task

    def delete_task(self, task_id: int) -> bool:
        """Deletes a task from the store.

        Args:
            task_id (int): The ID of the task to delete.

        Returns:
            bool: True if the task was deleted, False otherwise.
        """
        initial_len = len(self._tasks)
        self._tasks = [task for task in self._tasks if task.id != task_id]
        return len(self._tasks) < initial_len
