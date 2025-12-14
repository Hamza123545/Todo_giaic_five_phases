"use client";

/**
 * SortControls Component
 *
 * Dropdown UI for sorting tasks by various criteria
 * Supports sorting by creation date, title, update date, priority, due date
 */

import { cn } from "@/lib/utils";

export type SortOption = "created" | "title" | "updated" | "priority" | "due_date";
export type SortDirection = "asc" | "desc";

interface SortControlsProps {
  currentSort: SortOption;
  currentDirection?: SortDirection;
  onSortChange: (sort: SortOption, direction?: SortDirection) => void;
  className?: string;
}

export default function SortControls({
  currentSort,
  currentDirection = "desc",
  onSortChange,
  className,
}: SortControlsProps) {
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "created", label: "Creation Date" },
    { value: "updated", label: "Last Updated" },
    { value: "title", label: "Title (A-Z)" },
    { value: "priority", label: "Priority" },
    { value: "due_date", label: "Due Date" },
  ];

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value as SortOption, currentDirection);
  };

  const toggleDirection = () => {
    const newDirection = currentDirection === "asc" ? "desc" : "asc";
    onSortChange(currentSort, newDirection);
  };

  const getDirectionLabel = () => {
    if (currentSort === "title") {
      return currentDirection === "asc" ? "A → Z" : "Z → A";
    }
    if (currentSort === "priority") {
      return currentDirection === "asc" ? "Low → High" : "High → Low";
    }
    return currentDirection === "asc" ? "Oldest First" : "Newest First";
  };

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      role="group"
      aria-label="Sort tasks"
    >
      {/* Sort By Label */}
      <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Sort by:
      </label>

      {/* Sort Dropdown */}
      <select
        id="sort-select"
        value={currentSort}
        onChange={handleSortChange}
        className={cn(
          "px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600",
          "rounded-md shadow-sm text-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-500",
          "text-gray-700 dark:text-gray-300"
        )}
        aria-label="Select sort option"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Direction Toggle Button */}
      <button
        type="button"
        onClick={toggleDirection}
        className={cn(
          "flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800",
          "border border-gray-300 dark:border-gray-600 rounded-md shadow-sm",
          "hover:bg-gray-50 dark:hover:bg-gray-700",
          "focus:outline-none focus:ring-2 focus:ring-blue-500",
          "text-sm font-medium text-gray-700 dark:text-gray-300",
          "transition-colors"
        )}
        aria-label={`Change sort direction. Currently: ${getDirectionLabel()}`}
      >
        <svg
          className={cn(
            "w-4 h-4 transition-transform",
            currentDirection === "desc" && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 11l5-5m0 0l5 5m-5-5v12"
          />
        </svg>
        <span className="hidden sm:inline">{getDirectionLabel()}</span>
      </button>
    </div>
  );
}
