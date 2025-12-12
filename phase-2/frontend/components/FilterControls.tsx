"use client";

/**
 * FilterControls Component (Enhanced)
 *
 * Comprehensive filtering UI for tasks with support for:
 * - Status filtering (All, Pending, Completed)
 * - Priority filtering (Low, Medium, High)
 * - Due date filtering (Today, This Week, Overdue, No Date)
 * - Tags filtering (multi-select with autocomplete)
 *
 * Uses accordion layout for organized, collapsible filter sections
 */

import { cn } from "@/lib/utils";
import { TaskFilter, TaskPriority } from "@/types";
import { useState } from "react";

interface FilterControlsProps {
  currentFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;

  // Priority filtering
  selectedPriorities?: TaskPriority[];
  onPriorityChange?: (priorities: TaskPriority[]) => void;

  // Due date filtering
  dueDateFilter?: string;
  onDueDateChange?: (filter: string) => void;

  // Tags filtering
  selectedTags?: string[];
  availableTags?: string[];
  onTagsChange?: (tags: string[]) => void;

  // Task counts for display
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
  selectedPriorities = [],
  onPriorityChange,
  dueDateFilter,
  onDueDateChange,
  selectedTags = [],
  availableTags = [],
  onTagsChange,
  taskCounts,
  className,
}: FilterControlsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["status"]));

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const statusFilters: { value: TaskFilter; label: string; icon: string }[] = [
    { value: "all", label: "All Tasks", icon: "📋" },
    { value: "pending", label: "Pending", icon: "⏳" },
    { value: "completed", label: "Completed", icon: "✅" },
  ];

  const priorityFilters: { value: TaskPriority; label: string; icon: string; color: string }[] = [
    { value: "low", label: "Low", icon: "🟢", color: "green" },
    { value: "medium", label: "Medium", icon: "🟡", color: "yellow" },
    { value: "high", label: "High", icon: "🔴", color: "red" },
  ];

  const dueDateFilters: { value: string; label: string; icon: string }[] = [
    { value: "all", label: "All Dates", icon: "📅" },
    { value: "today", label: "Due Today", icon: "⏰" },
    { value: "week", label: "This Week", icon: "📆" },
    { value: "overdue", label: "Overdue", icon: "⚠️" },
    { value: "no-date", label: "No Due Date", icon: "∅" },
  ];

  const togglePriority = (priority: TaskPriority) => {
    if (!onPriorityChange) return;

    if (selectedPriorities.includes(priority)) {
      onPriorityChange(selectedPriorities.filter((p) => p !== priority));
    } else {
      onPriorityChange([...selectedPriorities, priority]);
    }
  };

  const toggleTag = (tag: string) => {
    if (!onTagsChange) return;

    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const clearAllFilters = () => {
    onFilterChange("all");
    onPriorityChange?.([]);
    onDueDateChange?.("all");
    onTagsChange?.([]);
  };

  const hasActiveFilters =
    currentFilter !== "all" ||
    selectedPriorities.length > 0 ||
    (dueDateFilter && dueDateFilter !== "all") ||
    selectedTags.length > 0;

  return (
    <div
      className={cn(
        "border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-4",
        className
      )}
      role="region"
      aria-label="Task filters"
    >
      {/* Header with Clear Filters button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            aria-label="Clear all filters"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Status Filter Section */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection("status")}
          className="w-full flex items-center justify-between text-left font-medium text-gray-900 dark:text-gray-100 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          aria-expanded={expandedSections.has("status")}
        >
          <span>Status</span>
          <span aria-hidden="true">{expandedSections.has("status") ? "▼" : "▶"}</span>
        </button>

        {expandedSections.has("status") && (
          <div
            className="flex flex-wrap gap-2 pl-2"
            role="group"
            aria-label="Filter tasks by status"
          >
            {statusFilters.map((filter) => {
              const isActive = currentFilter === filter.value;
              const count = taskCounts?.[filter.value];

              return (
                <button
                  key={filter.value}
                  onClick={() => onFilterChange(filter.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
                    "transition-all focus:outline-none focus:ring-2 focus:ring-blue-500",
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  )}
                  aria-label={`${filter.label}${count !== undefined ? ` (${count})` : ""}`}
                  aria-pressed={isActive}
                >
                  <span aria-hidden="true">{filter.icon}</span>
                  <span>{filter.label}</span>
                  {count !== undefined && (
                    <span
                      className={cn(
                        "ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold",
                        isActive
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Priority Filter Section */}
      {onPriorityChange && (
        <div className="mb-4">
          <button
            onClick={() => toggleSection("priority")}
            className="w-full flex items-center justify-between text-left font-medium text-gray-900 dark:text-gray-100 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            aria-expanded={expandedSections.has("priority")}
          >
            <span>Priority</span>
            <span aria-hidden="true">{expandedSections.has("priority") ? "▼" : "▶"}</span>
          </button>

          {expandedSections.has("priority") && (
            <div
              className="flex flex-wrap gap-2 pl-2"
              role="group"
              aria-label="Filter tasks by priority"
            >
              {priorityFilters.map((filter) => {
                const isActive = selectedPriorities.includes(filter.value);

                return (
                  <button
                    key={filter.value}
                    onClick={() => togglePriority(filter.value)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
                      "transition-all focus:outline-none focus:ring-2 focus:ring-blue-500",
                      isActive
                        ? filter.color === "red"
                          ? "bg-red-600 text-white"
                          : filter.color === "yellow"
                            ? "bg-yellow-600 text-white"
                            : "bg-green-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    )}
                    aria-label={filter.label}
                    aria-pressed={isActive}
                  >
                    <span aria-hidden="true">{filter.icon}</span>
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Due Date Filter Section */}
      {onDueDateChange && (
        <div className="mb-4">
          <button
            onClick={() => toggleSection("due-date")}
            className="w-full flex items-center justify-between text-left font-medium text-gray-900 dark:text-gray-100 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            aria-expanded={expandedSections.has("due-date")}
          >
            <span>Due Date</span>
            <span aria-hidden="true">{expandedSections.has("due-date") ? "▼" : "▶"}</span>
          </button>

          {expandedSections.has("due-date") && (
            <div
              className="flex flex-wrap gap-2 pl-2"
              role="group"
              aria-label="Filter tasks by due date"
            >
              {dueDateFilters.map((filter) => {
                const isActive = dueDateFilter === filter.value;

                return (
                  <button
                    key={filter.value}
                    onClick={() => onDueDateChange(filter.value)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
                      "transition-all focus:outline-none focus:ring-2 focus:ring-blue-500",
                      isActive
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    )}
                    aria-label={filter.label}
                    aria-pressed={isActive}
                  >
                    <span aria-hidden="true">{filter.icon}</span>
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tags Filter Section */}
      {onTagsChange && availableTags.length > 0 && (
        <div className="mb-2">
          <button
            onClick={() => toggleSection("tags")}
            className="w-full flex items-center justify-between text-left font-medium text-gray-900 dark:text-gray-100 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            aria-expanded={expandedSections.has("tags")}
          >
            <span>Tags</span>
            <span aria-hidden="true">{expandedSections.has("tags") ? "▼" : "▶"}</span>
          </button>

          {expandedSections.has("tags") && (
            <div
              className="flex flex-wrap gap-2 pl-2"
              role="group"
              aria-label="Filter tasks by tags"
            >
              {availableTags.map((tag) => {
                const isActive = selectedTags.includes(tag);

                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium",
                      "transition-all focus:outline-none focus:ring-2 focus:ring-blue-500",
                      isActive
                        ? "bg-purple-600 text-white shadow-md"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    )}
                    aria-label={tag}
                    aria-pressed={isActive}
                  >
                    <span aria-hidden="true">🏷️</span>
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
