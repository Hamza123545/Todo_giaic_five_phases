export type TaskStatus = 'todo' | 'in-progress' | 'done';

export const TASK_STATUS_MAP: Record<TaskStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
} as const;

export const KANBAN_COLUMNS: TaskStatus[] = ['todo', 'in-progress', 'done'];

/**
 * Map task to Kanban column based on task status or completed flag
 */
export function getTaskColumn(task: { completed?: boolean; status?: TaskStatus }): TaskStatus {
  if (task.completed) return 'done';
  if (task.status === 'in-progress') return 'in-progress';
  return 'todo';
}

