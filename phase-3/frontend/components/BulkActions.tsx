"use client";

/**
 * BulkActions Component
 *
 * Toolbar for performing bulk operations on selected tasks
 * Actions: Delete selected, Mark complete, Mark pending, Change priority
 * Shows count of selected tasks
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TaskPriority } from "@/types";

interface BulkActionsProps {
  selectedTaskIds: number[];
  onDeleteSelected: () => Promise<void>;
  onMarkComplete: () => Promise<void>;
  onMarkPending: () => Promise<void>;
  onChangePriority: (priority: TaskPriority) => Promise<void>;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  totalTaskCount: number;
  className?: string;
}

export default function BulkActions({
  selectedTaskIds,
  onDeleteSelected,
  onMarkComplete,
  onMarkPending,
  onChangePriority,
  onSelectAll,
  onDeselectAll,
  totalTaskCount,
  className,
}: BulkActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  const selectedCount = selectedTaskIds.length;
  const allSelected = selectedCount === totalTaskCount && totalTaskCount > 0;

  const handleAction = async (action: () => Promise<void>) => {
    try {
      setIsLoading(true);
      await action();
    } catch (error) {
      console.error("Bulk action error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriorityChange = async (priority: TaskPriority) => {
    await handleAction(() => onChangePriority(priority));
    setShowPriorityMenu(false);
  };

  if (selectedCount === 0) {
    return null; // Don't show bulk actions if no tasks selected
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-blue-600 dark:bg-blue-700 text-white shadow-2xl",
        "border-t-4 border-blue-500",
        "transition-transform duration-300 ease-in-out",
        className
      )}
      role="toolbar"
      aria-label="Bulk actions toolbar"
      aria-describedby="bulk-actions-description"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Selection Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" id="bulk-actions-description">
                {selectedCount} task{selectedCount !== 1 ? "s" : ""} selected
              </span>
              <button
                type="button"
                onClick={allSelected ? onDeselectAll : onSelectAll}
                className={cn(
                  "text-xs px-2 py-1 rounded",
                  "bg-blue-500 hover:bg-blue-400 dark:bg-blue-600 dark:hover:bg-blue-500",
                  "transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                )}
                aria-label={allSelected ? "Deselect all tasks" : "Select all tasks"}
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Mark Complete */}
            <button
              type="button"
              onClick={() => handleAction(onMarkComplete)}
              disabled={isLoading}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                "bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:opacity-50",
                "transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              )}
              aria-label="Mark selected tasks as complete"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="hidden sm:inline">Complete</span>
            </button>

            {/* Mark Pending */}
            <button
              type="button"
              onClick={() => handleAction(onMarkPending)}
              disabled={isLoading}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                "bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-800 disabled:opacity-50",
                "transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              )}
              aria-label="Mark selected tasks as pending"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="hidden sm:inline">Pending</span>
            </button>

            {/* Change Priority */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                  "bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:opacity-50",
                  "transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                )}
                aria-label="Change priority of selected tasks"
                aria-haspopup="menu"
                aria-expanded={showPriorityMenu}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
                <span className="hidden sm:inline">Priority</span>
                <svg
                  className={cn("w-3 h-3 transition-transform", showPriorityMenu && "rotate-180")}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Priority Dropdown Menu */}
              {showPriorityMenu && (
                <div
                  className="absolute bottom-full mb-2 right-0 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10"
                  role="menu"
                  aria-label="Priority options"
                >
                  <button
                    type="button"
                    onClick={() => handlePriorityChange("high")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-t-md transition-colors"
                    role="menuitem"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full" aria-hidden="true"></span>
                      High Priority
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePriorityChange("medium")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                    role="menuitem"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 bg-yellow-500 rounded-full"
                        aria-hidden="true"
                      ></span>
                      Medium Priority
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePriorityChange("low")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-b-md transition-colors"
                    role="menuitem"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full" aria-hidden="true"></span>
                      Low Priority
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Delete */}
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    `Are you sure you want to delete ${selectedCount} task${selectedCount !== 1 ? "s" : ""}?`
                  )
                ) {
                  handleAction(onDeleteSelected);
                }
              }}
              disabled={isLoading}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                "bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:opacity-50",
                "transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              )}
              aria-label="Delete selected tasks"
            >
              <svg
                className="w-4 h-4"
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
              <span className="hidden sm:inline">Delete</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onDeselectAll}
              className={cn(
                "px-2 py-2 rounded-md text-sm font-medium",
                "bg-blue-500 hover:bg-blue-400 dark:bg-blue-600 dark:hover:bg-blue-500",
                "transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              )}
              aria-label="Close bulk actions"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
