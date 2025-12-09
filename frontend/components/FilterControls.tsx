"use client";

/**
 * FilterControls Component
 *
 * UI controls for filtering tasks by status (All, Pending, Completed), priority, due date, and tags
 * Updates in real-time when user selects a filter
 */

import { cn } from "@/lib/utils";
import { TaskFilter, TaskPriority } from "@/types";

interface FilterControlsProps {
  currentFilter: TaskFilter;
  currentPriority?: TaskPriority | "all";
  currentDueDate?: "all" | "overdue" | "today" | "this-week" | "this-month";
  currentTags?: string[];
  onFilterChange: (filter: TaskFilter) => void;
  onPriorityChange?: (priority: TaskPriority | "all") => void;
  onDueDateChange?: (dueDate: "all" | "overdue" | "today" | "this-week" | "this-month") => void;
  onTagsChange?: (tags: string[]) => void;
  taskCounts?: {
    all: number;
    pending: number;
    completed: number;
  };
  availableTags?: string[];
  className?: string;
}

export default function FilterControls({
  currentFilter,
  currentPriority = "all",
  currentDueDate = "all",
  currentTags = [],
  onFilterChange,
  onPriorityChange,
  onDueDateChange,
  onTagsChange,
  taskCounts,
  availableTags = [],
  className,
}: FilterControlsProps) {
  const filters = [
    { value: "all" as TaskFilter, label: "All Tasks", icon: "📋" },
    { value: "pending" as TaskFilter, label: "Pending", icon: "⏳" },
    { value: "completed" as TaskFilter, label: "Completed", icon: "✅" },
  ];

  const priorities = [
    { value: "all", label: "All Priorities" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  const dueDateOptions = [
    { value: "all", label: "All Dates" },
    { value: "overdue", label: "Overdue" },
    { value: "today", label: "Today" },
    { value: "this-week", label: "This Week" },
    { value: "this-month", label: "This Month" },
  ];

  const handleTagToggle = (tag: string) => {
    if (currentTags.includes(tag)) {
      onTagsChange?.(currentTags.filter(t => t !== tag));
    } else {
      onTagsChange?.([...currentTags, tag]);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Status Filter */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter tasks by status">
        {filters.map((filter) => {
          const isActive = currentFilter === filter.value;
          const count = taskCounts?.[filter.value];

          return (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium",
                "transition-all focus:outline-none focus:ring-2 focus:ring-blue-500",
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
              aria-label={`${filter.label}${count !== undefined ? ` (${count})` : ""}`}
              aria-pressed={isActive}
            >
              <span aria-hidden="true">{filter.icon}</span>
              <span>{filter.label}</span>
              {count !== undefined && (
                <span
                  className={cn(
                    "ml-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                    isActive
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  )}
                  aria-label={`${count} tasks`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Priority and Due Date Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Priority Filter */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Priority:
          </label>
          <select
            value={currentPriority}
            onChange={(e) => onPriorityChange?.(e.target.value as TaskPriority | "all")}
            className={cn(
              "px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600",
              "rounded-md shadow-sm text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              "text-gray-700 dark:text-gray-300"
            )}
            aria-label="Filter by priority"
          >
            {priorities.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date Filter */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Due Date:
          </label>
          <select
            value={currentDueDate}
            onChange={(e) => onDueDateChange?.(e.target.value as "all" | "overdue" | "today" | "this-week" | "this-month")}
            className={cn(
              "px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600",
              "rounded-md shadow-sm text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              "text-gray-700 dark:text-gray-300"
            )}
            aria-label="Filter by due date"
          >
            {dueDateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags Filter */}
      {availableTags.length > 0 && (
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tags:
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium",
                  "transition-all focus:outline-none focus:ring-2 focus:ring-blue-500",
                  currentTags.includes(tag)
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                )}
                aria-pressed={currentTags.includes(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}