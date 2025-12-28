/**
 * Task Commands Utility
 *
 * Provides command pattern implementations for reversible task operations
 * Used with undo/redo functionality
 */

import { Task, TaskFormData } from "@/types";
import { Command } from "@/hooks/useUndoRedo";
import { api } from "./api";

/**
 * Create command for creating a new task
 */
export function createTaskCommand(
  userId: string,
  taskData: TaskFormData,
  onSuccess?: () => void
): Command<{ taskId: number | null }> {
  let createdTaskId: number | null = null;

  return {
    execute: async () => {
      const response = await api.createTask(userId, taskData);
      if (response.success && response.data) {
        createdTaskId = response.data.id;
        onSuccess?.();
      }
    },
    undo: async () => {
      if (createdTaskId) {
        await api.deleteTask(userId, createdTaskId);
        onSuccess?.();
      }
    },
    description: `Created task: ${taskData.title}`,
    data: { taskId: createdTaskId },
  };
}

/**
 * Create command for updating a task
 */
export function updateTaskCommand(
  userId: string,
  taskId: number,
  oldData: Task,
  newData: Partial<TaskFormData>,
  onSuccess?: () => void
): Command<{ oldData: Task; newData: Partial<TaskFormData> }> {
  return {
    execute: async () => {
      await api.updateTask(userId, taskId, newData);
      onSuccess?.();
    },
    undo: async () => {
      const revertData: Partial<TaskFormData> = {
        title: oldData.title,
        description: oldData.description,
        priority: oldData.priority,
        due_date: oldData.due_date,
        tags: oldData.tags,
      };
      await api.updateTask(userId, taskId, revertData);
      onSuccess?.();
    },
    description: `Updated task: ${oldData.title}`,
    data: { oldData, newData },
  };
}

/**
 * Create command for deleting a task
 */
export function deleteTaskCommand(
  userId: string,
  task: Task,
  onSuccess?: () => void
): Command<{ deletedTask: Task }> {
  return {
    execute: async () => {
      await api.deleteTask(userId, task.id);
      onSuccess?.();
    },
    undo: async () => {
      const taskData: TaskFormData = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        due_date: task.due_date,
        tags: task.tags,
      };
      await api.createTask(userId, taskData);
      onSuccess?.();
    },
    description: `Deleted task: ${task.title}`,
    data: { deletedTask: task },
  };
}

/**
 * Create command for toggling task completion
 */
export function toggleTaskCompleteCommand(
  userId: string,
  task: Task,
  onSuccess?: () => void
): Command<{ taskId: number; completed: boolean }> {
  const newCompleted = !task.completed;

  return {
    execute: async () => {
      await api.toggleTaskComplete(userId, task.id, newCompleted);
      onSuccess?.();
    },
    undo: async () => {
      await api.toggleTaskComplete(userId, task.id, task.completed);
      onSuccess?.();
    },
    description: newCompleted
      ? `Marked task as complete: ${task.title}`
      : `Marked task as incomplete: ${task.title}`,
    data: { taskId: task.id, completed: newCompleted },
  };
}

/**
 * Create command for reordering tasks
 */
export function reorderTasksCommand(
  userId: string,
  oldOrder: number[],
  newOrder: number[],
  onSuccess?: () => void
): Command<{ oldOrder: number[]; newOrder: number[] }> {
  return {
    execute: async () => {
      await api.reorderTasks(userId, newOrder);
      onSuccess?.();
    },
    undo: async () => {
      await api.reorderTasks(userId, oldOrder);
      onSuccess?.();
    },
    description: "Reordered tasks",
    data: { oldOrder, newOrder },
  };
}

/**
 * Create command for bulk delete
 */
export function bulkDeleteTasksCommand(
  userId: string,
  tasks: Task[],
  onSuccess?: () => void
): Command<{ deletedTasks: Task[] }> {
  const taskIds = tasks.map((t) => t.id);

  return {
    execute: async () => {
      await api.bulkDeleteTasks(userId, taskIds);
      onSuccess?.();
    },
    undo: async () => {
      // Recreate all deleted tasks
      for (const task of tasks) {
        const taskData: TaskFormData = {
          title: task.title,
          description: task.description,
          priority: task.priority,
          due_date: task.due_date,
          tags: task.tags,
        };
        await api.createTask(userId, taskData);
      }
      onSuccess?.();
    },
    description: `Deleted ${tasks.length} task${tasks.length !== 1 ? "s" : ""}`,
    data: { deletedTasks: tasks },
  };
}

/**
 * Create command for bulk status update
 */
export function bulkUpdateStatusCommand(
  userId: string,
  tasks: Task[],
  completed: boolean,
  onSuccess?: () => void
): Command<{ taskIds: number[]; oldStates: boolean[]; newState: boolean }> {
  const taskIds = tasks.map((t) => t.id);
  const oldStates = tasks.map((t) => t.completed);

  return {
    execute: async () => {
      await api.bulkUpdateTaskStatus(userId, taskIds, completed);
      onSuccess?.();
    },
    undo: async () => {
      // Restore each task to its original state
      for (let i = 0; i < tasks.length; i++) {
        await api.toggleTaskComplete(userId, tasks[i].id, oldStates[i]);
      }
      onSuccess?.();
    },
    description: `Marked ${tasks.length} task${tasks.length !== 1 ? "s" : ""} as ${
      completed ? "complete" : "incomplete"
    }`,
    data: { taskIds, oldStates, newState: completed },
  };
}
