"use client";

/**
 * TaskItem Component
 *
 * Individual task card/row displaying task information
 * Supports edit, delete, and toggle complete actions
 * Integrates with API client for task operations
 * Enhanced with Framer Motion animations
 */

import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task, TaskPriority } from "@/types";
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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [isSaving, setIsSaving] = useState(false);

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
    } catch (error) {
      // Revert optimistic update
      setOptimisticCompleted(!newCompleted);
      console.error("Failed to toggle task:", error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Are you sure you want to delete "${task.title}"?`);

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await api.deleteTask(userId, task.id);

      if (!response.success) {
        throw new Error(response.message || "Failed to delete task");
      }
      onSuccess?.();
    } catch (error) {
      console.error("Failed to delete task:", error);
      setIsDeleting(false);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  };

  const handleTitleDoubleClick = () => {
    if (!isDeleting && !isToggling) {
      setIsEditingTitle(true);
      setEditedTitle(task.title);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTitle(e.target.value);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
      setEditedTitle(task.title);
    }
  };

  const handleTitleBlur = () => {
    handleTitleSave();
  };

  const handleTitleSave = async () => {
    const trimmedTitle = editedTitle.trim();

    if (!trimmedTitle) {
      setEditedTitle(task.title);
      setIsEditingTitle(false);
      return;
    }

    if (trimmedTitle === task.title) {
      setIsEditingTitle(false);
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.updateTask(userId, task.id, {
        title: trimmedTitle,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to update task");
      }

      setIsEditingTitle(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update task title:", error);
      setEditedTitle(task.title);
      setIsEditingTitle(false);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsSaving(false);
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

  const isOverdue = task.due_date && !optimisticCompleted && new Date(task.due_date) < new Date();

  const baseClasses = cn(
    "relative transition-all",
    isDeleting && "opacity-50 pointer-events-none",
    optimisticCompleted && "opacity-75"
  );

  if (viewMode === "card") {
    return (
      <motion.article
        layout
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, x: -100 }}
        whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
        transition={{ duration: 0.2 }}
        className={cn(
          baseClasses,
          "p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border",
          "border-gray-200 dark:border-gray-700",
          className
        )}
        aria-label={`Task: ${task.title}`}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Checkbox */}
            <motion.button
              type="button"
              onClick={handleToggleComplete}
              disabled={isToggling || isDeleting}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "mt-1 w-5 h-5 rounded border-2 flex items-center justify-center",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                "transition-colors",
                optimisticCompleted
                  ? "bg-blue-600 border-blue-600"
                  : "border-gray-300 dark:border-gray-600 hover:border-blue-500"
              )}
              aria-label={optimisticCompleted ? "Mark as incomplete" : "Mark as complete"}
              aria-pressed={optimisticCompleted}
            >
              <AnimatePresence mode="wait">
                {optimisticCompleted && (
                  <motion.svg
                    key="checkmark"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.3, type: "spring" }}
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
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Title and Description */}
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={handleTitleChange}
                  onKeyDown={handleTitleKeyDown}
                  onBlur={handleTitleBlur}
                  disabled={isSaving}
                  autoFocus
                  className={cn(
                    "w-full px-2 py-1 text-base font-medium border-2 border-blue-500 rounded",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                    isSaving && "opacity-50 cursor-wait"
                  )}
                  aria-label="Edit task title"
                />
              ) : (
                <h4
                  className={cn(
                    "text-base font-medium wrap-break-word cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors",
                    optimisticCompleted
                      ? "line-through text-gray-500 dark:text-gray-400"
                      : "text-gray-900 dark:text-white"
                  )}
                  onDoubleClick={handleTitleDoubleClick}
                  title="Double-click to edit"
                >
                  {task.title}
                </h4>
              )}
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
            className={cn("px-2 py-1 rounded-full font-medium", getPriorityColor(task.priority))}
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
      </motion.article>
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
          "mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0",
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={editedTitle}
                onChange={handleTitleChange}
                onKeyDown={handleTitleKeyDown}
                onBlur={handleTitleBlur}
                disabled={isSaving}
                autoFocus
                className={cn(
                  "w-full px-2 py-1 text-base font-medium border-2 border-blue-500 rounded",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                  isSaving && "opacity-50 cursor-wait"
                )}
                aria-label="Edit task title"
              />
            ) : (
              <h4
                className={cn(
                  "text-base font-medium wrap-break-word cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors",
                  optimisticCompleted
                    ? "line-through text-gray-500 dark:text-gray-400"
                    : "text-gray-900 dark:text-white"
                )}
                onDoubleClick={handleTitleDoubleClick}
                title="Double-click to edit"
              >
                {task.title}
              </h4>
            )}
            {task.description && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
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
              "transition-colors shrink-0"
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
            className={cn("px-2 py-1 rounded-full font-medium", getPriorityColor(task.priority))}
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
