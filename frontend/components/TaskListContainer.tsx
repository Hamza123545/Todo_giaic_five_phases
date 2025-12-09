"use client";

/**
 * TaskListContainer Component
 *
 * Container component that manages state and API calls for task list operations
 * Handles filtering, sorting, search, and pagination with API integration
 * Maintains state in URL query parameters
 */

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Task, TaskFilter, TaskPriority, TaskQueryParams } from "@/types";
import { api } from "@/lib/api";
import FilterControls from "./FilterControls";
import SortControls from "./SortControls";
import SearchBar from "./SearchBar";
import TaskList from "./TaskList";
import LoadingSpinner from "./LoadingSpinner";

interface TaskListContainerProps {
  userId: string;
  className?: string;
}

export default function TaskListContainer({ userId, className }: TaskListContainerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state from URL parameters
  const [currentFilter, setCurrentFilter] = useState<TaskFilter>(
    (searchParams.get("status") as TaskFilter) || "all"
  );
  const [currentPriority, setCurrentPriority] = useState<TaskPriority | "all">(
    (searchParams.get("priority") as TaskPriority | "all") || "all"
  );
  const [currentDueDate, setCurrentDueDate] = useState<"all" | "overdue" | "today" | "this-week" | "this-month">(
    (searchParams.get("due_date") as "all" | "overdue" | "today" | "this-week" | "this-month") || "all"
  );
  const [currentTags, setCurrentTags] = useState<string[]>(
    searchParams.getAll("tags") || []
  );
  const [currentSort, setCurrentSort] = useState<"created" | "title" | "updated" | "priority" | "due_date" | "tags">(
    (searchParams.get("sort")?.split(":")[0] as "created" | "title" | "updated" | "priority" | "due_date" | "tags") || "created"
  );
  const [currentDirection, setCurrentDirection] = useState<"asc" | "desc">(
    (searchParams.get("sort")?.split(":")[1] as "asc" | "desc") || "desc"
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [limit] = useState(20); // Fixed limit for pagination

  // State for data and loading
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid" | "kanban">("list");

  // Build query parameters from current state
  const queryParams = useMemo(() => {
    const params: TaskQueryParams = {
      status: currentFilter,
      priority: currentPriority,
      dueDate: currentDueDate,
      tags: currentTags,
      sort: `${currentSort}:${currentDirection}`,
      search: searchQuery,
      page,
      limit
    };

    return params;
  }, [currentFilter, currentPriority, currentDueDate, currentTags, currentSort, currentDirection, searchQuery, page, limit]);

  // Update URL parameters when state changes
  useEffect(() => {
    const params = new URLSearchParams();

    if (currentFilter !== "all") params.set("status", currentFilter);
    if (currentPriority !== "all") params.set("priority", currentPriority);
    if (currentDueDate !== "all") params.set("due_date", currentDueDate);
    if (currentTags.length > 0) {
      currentTags.forEach(tag => params.append("tags", tag));
    }
    params.set("sort", `${currentSort}:${currentDirection}`);
    if (searchQuery) params.set("search", searchQuery);
    if (page !== 1) params.set("page", page.toString());

    // Update the URL without causing a full page reload
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [currentFilter, currentPriority, currentDueDate, currentTags, currentSort, currentDirection, searchQuery, page, pathname, router]);

  // Fetch tasks based on current filters, sorting, and search
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.getTasks(userId, queryParams);

        if (response.success && response.data) {
          setTasks(response.data.data);
        } else {
          setError(response.error?.message || "Failed to fetch tasks");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [userId, queryParams]);

  // Extract unique tags from all tasks for the filter
  useEffect(() => {
    const allTags = tasks.flatMap(task => task.tags);
    const uniqueTags = Array.from(new Set(allTags));
    setAvailableTags(uniqueTags);
  }, [tasks]);

  // Handle task changes (create, update, delete)
  const handleTaskChange = () => {
    // Refetch tasks to get updated data
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.getTasks(userId, queryParams);

        if (response.success && response.data) {
          setTasks(response.data.data);
        } else {
          setError(response.error?.message || "Failed to fetch tasks");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  };

  // Calculate task counts for filter controls
  const taskCounts = useMemo(() => ({
    all: tasks.length,
    pending: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
  }), [tasks]);

  return (
    <div className={className}>
      {/* Controls Section */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <SearchBar
          onSearch={setSearchQuery}
          placeholder="Search tasks by title, description, or tags..."
        />

        {/* Filter, Sort, and View Mode Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            <FilterControls
              currentFilter={currentFilter}
              currentPriority={currentPriority}
              currentDueDate={currentDueDate}
              currentTags={currentTags}
              onFilterChange={setCurrentFilter}
              onPriorityChange={setCurrentPriority}
              onDueDateChange={setCurrentDueDate}
              onTagsChange={setCurrentTags}
              taskCounts={taskCounts}
              availableTags={availableTags}
            />

            <SortControls
              currentSort={currentSort}
              currentDirection={currentDirection}
              onSortChange={(sort, direction) => {
                setCurrentSort(sort);
                if (direction) setCurrentDirection(direction);
              }}
            />
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
            <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-md">
              {(["list", "grid", "kanban"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                  aria-label={`Switch to ${mode} view`}
                  aria-pressed={viewMode === mode}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <TaskList
        tasks={tasks}
        userId={userId}
        isLoading={loading}
        onTaskChange={handleTaskChange}
        onError={(err) => setError(err.message || "An error occurred")}
        viewMode={viewMode}
      />

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}