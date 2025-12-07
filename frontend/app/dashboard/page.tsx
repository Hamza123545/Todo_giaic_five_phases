"use client";

/**
 * Dashboard Page
 *
 * Main task management page (protected route)
 * Displays user name, sign out button
 * Task creation form and task list
 * Requires authentication
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getCurrentUser, signOut } from "@/lib/auth";
import { User, Task, LoadingState, TaskQueryParams, SortField, SortParam, TaskFilter, SortConfig } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";
import FilterControls from "@/components/FilterControls";
import SortControls from "@/components/SortControls";
import SearchBar from "@/components/SearchBar";
import { api } from "@/lib/api";

function DashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "created",
    direction: "desc"
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        // Map Better Auth user to our User type
        if (currentUser) {
          const mappedUser: User = {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            created_at: currentUser.createdAt.toISOString(),
            updated_at: currentUser.updatedAt.toISOString(),
          };
          setUser(mappedUser);

          // Load tasks for the user
          loadTasks(mappedUser.id);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  // Load tasks when filter, sort, or search changes
  useEffect(() => {
    if (user) {
      loadTasks(user.id);
    }
  }, [filter, sortConfig, searchQuery, user]);

  const loadTasks = async (userId: string) => {
    try {
      setLoadingState("loading");

      // Convert sort key to API format
      let apiSortKey: string;
      switch (sortConfig.key) {
        case "created":
          apiSortKey = "created";
          break;
        case "updated":
          apiSortKey = "updated";
          break;
        case "due_date":
          apiSortKey = "due_date";
          break;
        case "title":
          apiSortKey = "title";
          break;
        case "priority":
          apiSortKey = "priority";
          break;
        default:
          apiSortKey = "created";
      }

      const sortParam: SortParam = `${apiSortKey}:${sortConfig.direction}` as SortParam;

      const queryParams: TaskQueryParams = {
        status: filter,
        sort: sortParam,
        search: searchQuery,
        page: 1,
        limit: 50, // Adjust as needed
      };

      const response = await api.getTasks(userId, queryParams);
      if (response.success && response.data) {
        setTasks(response.data.data || []);
        setLoadingState("success");
      } else {
        throw new Error(response.message || "Failed to load tasks");
      }
    } catch (error) {
      console.error("Failed to load tasks:", error);
      setLoadingState("error");
    }
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks(prev => [newTask, ...prev]);
    setIsTaskFormOpen(false);
  };

  const handleTaskUpdated = () => {
    // Reload tasks to get the latest data
    if (user) {
      loadTasks(user.id);
    }
  };

  const handleTaskError = (error: Error) => {
    console.error("Task operation error:", error);
    // In a real app, you might want to show a toast notification
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/signin");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleSortChange = (key: "created" | "title" | "updated" | "priority" | "due_date", direction?: "asc" | "desc") => {
    setSortConfig(prev => ({
      key,
      direction: direction || (prev.key === key && prev.direction === "asc" ? "desc" : "asc")
    }));
  };

  const handleFilterChange = (newFilter: TaskFilter) => {
    setFilter(newFilter);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" label="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
              {user && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Welcome back, {user.name}!
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* Dark Mode Toggle - Placeholder */}
              <button
                type="button"
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                aria-label="Toggle dark mode"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              </button>

              {/* Settings Button - Placeholder */}
              <button
                type="button"
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                aria-label="Settings"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task Creation and List - Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Creation Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isTaskFormOpen ? "Create New Task" : "Add New Task"}
                </h2>
                {!isTaskFormOpen && (
                  <button
                    onClick={() => setIsTaskFormOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add Task
                  </button>
                )}
              </div>

              {isTaskFormOpen ? (
                <TaskForm
                  userId={user?.id || ""}
                  onSuccess={handleTaskCreated}
                  onError={handleTaskError}
                  onCancel={() => setIsTaskFormOpen(false)}
                />
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Click "Add Task" to create a new task.
                </p>
              )}
            </div>

            {/* Task List with Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Your Tasks ({tasks.length})
                </h2>

                <div className="flex flex-wrap gap-2">
                  <FilterControls
                    currentFilter={filter}
                    onFilterChange={handleFilterChange}
                    taskCounts={{
                      all: tasks.length,
                      pending: tasks.filter(t => !t.completed).length,
                      completed: tasks.filter(t => t.completed).length
                    }}
                  />

                  <SortControls
                    currentSort={sortConfig.key}
                    currentDirection={sortConfig.direction}
                    onSortChange={handleSortChange}
                  />
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <SearchBar
                  onSearch={setSearchQuery}
                  placeholder="Search tasks..."
                />
              </div>

              {/* Task List */}
              <TaskList
                tasks={tasks}
                userId={user?.id || ""}
                onTaskChange={handleTaskUpdated}
                onError={handleTaskError}
                isLoading={loadingState === "loading"}
              />
            </div>
          </div>

          {/* Statistics and Filters - Right Column (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Statistics
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                  <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {tasks.filter(t => !t.completed).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {tasks.filter(t => t.completed).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  Export Tasks
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  Import Tasks
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                  Clear Completed
                </button>
              </div>
            </div>

            {/* View Options */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                View Options
              </h2>
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  onClick={() => {
                    // In a real app, this would change the view mode
                    console.log("Switching to list view");
                  }}
                >
                  List View
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  onClick={() => {
                    // In a real app, this would change the view mode
                    console.log("Switching to grid view");
                  }}
                >
                  Grid View
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  onClick={() => {
                    // In a real app, this would change the view mode
                    console.log("Switching to kanban view");
                  }}
                >
                  Kanban View
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
