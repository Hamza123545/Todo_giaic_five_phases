"use client";

/**
 * FilterControls Component
 *
 * UI controls for filtering tasks by status (All, Pending, Completed)
 * Updates in real-time when user selects a filter
 */

import { cn } from "@/lib/utils";
import { TaskFilter } from "@/types";

interface FilterControlsProps {
  currentFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  taskCounts?: {
    all: number;
    pending: number;
    completed: number;
  };
  className?: string;
}

export default function FilterControls({
  currentFilter,
  onFilterChange,
  taskCounts,
  className,
}: FilterControlsProps) {
  const filters: { value: TaskFilter; label: string; icon: string }[] = [
    { value: "all", label: "All Tasks", icon: "📋" },
    { value: "pending", label: "Pending", icon: "⏳" },
    { value: "completed", label: "Completed", icon: "✅" },
  ];

  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      role="group"
      aria-label="Filter tasks by status"
    >
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
  );
}
