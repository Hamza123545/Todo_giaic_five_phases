"use client";

/**
 * TaskList Component
 *
 * Displays a list of tasks with filtering, sorting, and loading states
 * Supports different view modes (list, grid, kanban)
 */

import { Task, LoadingState, TaskViewMode } from "@/types";
import { cn } from "@/lib/utils";
import { memo, useMemo } from "react";
import TaskItem from "./TaskItem";
import LoadingSpinner from "./LoadingSpinner";

interface TaskListProps {
  tasks: Task[];
  userId: string;
  isLoading?: boolean;
  onTaskChange?: () => void;
  onError?: (error: Error) => void;
  viewMode?: "list" | "grid" | "kanban";
  emptyMessage?: string;
  className?: string;
}

const TaskList = memo(function TaskList({
  tasks,
  userId,
  isLoading = false,
  onTaskChange,
  onError,
  viewMode = "list",
  emptyMessage = "No tasks found. Create your first task to get started!",
  className,
}: TaskListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        role="status"
        aria-live="polite"
        aria-label="Loading tasks"
      >
        <LoadingSpinner size="large" label="Loading tasks..." />
      </div>
    );
  }

  // Empty state
  if (!tasks || tasks.length === 0) {
    return (
      <div
        className="text-center py-12 text-gray-500 dark:text-gray-400"
        role="status"
        aria-live="polite"
      >
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  // Memoize computed values
  const { pendingTasks, completedTasks } = useMemo(() => {
    if (viewMode === 'kanban') {
      return {
        pendingTasks: tasks.filter((task) => !task.completed),
        completedTasks: tasks.filter((task) => task.completed),
      };
    }
    return { pendingTasks: [], completedTasks: [] };
  }, [tasks, viewMode]);

  // Memoize list items to prevent unnecessary re-renders
  const listItems = useMemo(() => (
    <ul
      className={cn("space-y-3", className)}
      role="list"
      aria-label="Task list"
    >
      {tasks.map((task) => (
        <li key={task.id}>
          <TaskItem
            task={task}
            userId={userId}
            onSuccess={onTaskChange}
            onError={onError}
          />
        </li>
      ))}
    </ul>
  ), [tasks, userId, onTaskChange, onError, className]);

  const gridItems = useMemo(() => (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
        className
      )}
      role="list"
      aria-label="Task grid"
    >
      {tasks.map((task) => (
        <div key={task.id}>
          <TaskItem
            task={task}
            userId={userId}
            onSuccess={onTaskChange}
            onError={onError}
            viewMode="card"
          />
        </div>
      ))}
    </div>
  ), [tasks, userId, onTaskChange, onError, className]);

  const kanbanView = useMemo(() => (
    <div
      className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", className)}
      role="region"
      aria-label="Kanban board"
    >
      {/* Pending Column */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span
            className="w-3 h-3 bg-yellow-500 rounded-full"
            aria-hidden="true"
          ></span>
          Pending ({pendingTasks.length})
        </h3>
        <div
          className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg min-h-[200px]"
          role="list"
          aria-label="Pending tasks"
        >
          {pendingTasks.length > 0 ? (
            pendingTasks.map((task) => (
              <div key={task.id}>
                <TaskItem
                  task={task}
                  userId={userId}
                  onSuccess={onTaskChange}
                  onError={onError}
                  viewMode="card"
                />
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No pending tasks
            </p>
          )}
        </div>
      </div>

      {/* Completed Column */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span
            className="w-3 h-3 bg-green-500 rounded-full"
            aria-hidden="true"
          ></span>
          Completed ({completedTasks.length})
        </h3>
        <div
          className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg min-h-[200px]"
          role="list"
          aria-label="Completed tasks"
        >
          {completedTasks.length > 0 ? (
            completedTasks.map((task) => (
              <div key={task.id}>
                <TaskItem
                  task={task}
                  userId={userId}
                  onSuccess={onTaskChange}
                  onError={onError}
                  viewMode="card"
                />
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No completed tasks
            </p>
          )}
        </div>
      </div>
    </div>
  ), [completedTasks, pendingTasks, userId, onTaskChange, onError, className]);

  // Render based on selected view mode
  switch (viewMode) {
    case "grid":
      return gridItems;
    case "kanban":
      return kanbanView;
    case "list":
    default:
      return listItems;
  }
});

export default TaskList;
