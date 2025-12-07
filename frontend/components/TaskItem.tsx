"use client";

/**
 * TaskItem Component
 *
 * Individual task card/row displaying task information
 * Supports edit, delete, and toggle complete actions
 * Integrates with API client for task operations
 */

import { useState, memo } from "react";
import { Task, TaskPriority, ApiResponse } from "@/types";
import { cn, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";

interface TaskItemProps {
  task: Task;
  userId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  viewMode?: "list" | "card";
  className?: string;
}

const TaskItem = memo(function TaskItem({
  task,
  userId,
  onSuccess,
  onError,
  viewMode = "list",
  className,
}: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [optimisticCompleted, setOptimisticCompleted] = useState(task.completed);

  const handleToggleComplete = async () => {
    setIsToggling(true);

    // Optimistic update
    const newCompleted = !optimisticCompleted;
    setOptimisticCompleted(newCompleted);

    try {
      const response = await api.toggleTaskComplete(userId, task.id, newCompleted);

      if (!response.success) {
        // Revert optimistic update
        setOptimisticCompleted(!newCompleted);
        throw new Error(response.message || "Failed to toggle task");
      }
    } catch (error: any) {
      // Revert optimistic update
      setOptimisticCompleted(!newCompleted);
      console.error("Failed to toggle task:", error);
      onError?.(error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await api.deleteTask(userId, task.id);

      if (!response.success) {
        throw new Error(response.message || "Failed to delete task");
      }
    } catch (error: any) {
      console.error("Failed to delete task:", error);
      setIsDeleting(false);
      onError?.(error);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const isOverdue =
    task.due_date &&
    !optimisticCompleted &&
    new Date(task.due_date) < new Date();

  const baseClasses = cn(
    "relative transition-all",
    isDeleting && "opacity-50 pointer-events-none",
    optimisticCompleted && "opacity-75"
  );

  if (viewMode === "card") {
    return (
      <article
        className={cn(
          baseClasses,
          "p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border",
          "border-gray-200 dark:border-gray-700 hover:shadow-md",
          className
        )}
        aria-label={`Task: ${task.title}`}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Checkbox */}
            <button
              type="button"
              onClick={handleToggleComplete}
              disabled={isToggling || isDeleting}
              className={cn(
                "mt-1 w-5 h-5 rounded border-2 flex items-center justify-center",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                "transition-colors",
                optimisticCompleted
                  ? "bg-blue-600 border-blue-600"
                  : "border-gray-300 dark:border-gray-600 hover:border-blue-500"
              )}
              aria-label={
                optimisticCompleted ? "Mark as incomplete" : "Mark as complete"
              }
              aria-pressed={optimisticCompleted}
            >
              {optimisticCompleted && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>

            {/* Title and Description */}
            <div className="flex-1 min-w-0">
              <h4
                className={cn(
                  "text-base font-medium break-words",
                  optimisticCompleted
                    ? "line-through text-gray-500 dark:text-gray-400"
                    : "text-gray-900 dark:text-white"
                )}
              >
                {task.title}
              </h4>
              {task.description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
          </div>

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || isToggling}
            className={cn(
              "p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400",
              "focus:outline-none focus:ring-2 focus:ring-red-500 rounded",
              "transition-colors"
            )}
            aria-label={`Delete task ${task.title}`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        {/* Card Footer */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
          {/* Priority Badge */}
          <span
            className={cn(
              "px-2 py-1 rounded-full font-medium",
              getPriorityColor(task.priority)
            )}
            aria-label={`Priority: ${task.priority}`}
          >
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>

          {/* Due Date */}
          {task.due_date && (
            <span
              className={cn(
                "px-2 py-1 rounded-full",
                isOverdue
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 font-medium"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              )}
              aria-label={`Due date: ${formatDate(task.due_date)}`}
            >
              📅 {formatDate(task.due_date)}
              {isOverdue && " (Overdue)"}
            </span>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1" role="list" aria-label="Tags">
              {task.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-full"
                  role="listitem"
                >
                  {tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="px-2 py-1 text-gray-600 dark:text-gray-400">
                  +{task.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </article>
    );
  }

  // List view
  return (
    <article
      className={cn(
        baseClasses,
        "flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg",
        "border border-gray-200 dark:border-gray-700 hover:shadow-md",
        className
      )}
      aria-label={`Task: ${task.title}`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={handleToggleComplete}
        disabled={isToggling || isDeleting}
        className={cn(
          "mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
          "focus:outline-none focus:ring-2 focus:ring-blue-500",
          "transition-colors",
          optimisticCompleted
            ? "bg-blue-600 border-blue-600"
            : "border-gray-300 dark:border-gray-600 hover:border-blue-500"
        )}
        aria-label={optimisticCompleted ? "Mark as incomplete" : "Mark as complete"}
        aria-pressed={optimisticCompleted}
      >
        {optimisticCompleted && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4
              className={cn(
                "text-base font-medium break-words",
                optimisticCompleted
                  ? "line-through text-gray-500 dark:text-gray-400"
                  : "text-gray-900 dark:text-white"
              )}
            >
              {task.title}
            </h4>
            {task.description && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {task.description}
              </p>
            )}
          </div>

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || isToggling}
            className={cn(
              "p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400",
              "focus:outline-none focus:ring-2 focus:ring-red-500 rounded",
              "transition-colors flex-shrink-0"
            )}
            aria-label={`Delete task ${task.title}`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
          {/* Priority Badge */}
          <span
            className={cn(
              "px-2 py-1 rounded-full font-medium",
              getPriorityColor(task.priority)
            )}
            aria-label={`Priority: ${task.priority}`}
          >
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>

          {/* Due Date */}
          {task.due_date && (
            <span
              className={cn(
                "px-2 py-1 rounded-full",
                isOverdue
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 font-medium"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              )}
              aria-label={`Due date: ${formatDate(task.due_date)}`}
            >
              📅 {formatDate(task.due_date)}
              {isOverdue && " (Overdue)"}
            </span>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1" role="list" aria-label="Tags">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-full"
                  role="listitem"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
});

export default TaskItem;
