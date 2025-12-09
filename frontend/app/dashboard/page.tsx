"use client";

/**
 * Dashboard Page
 *
 * Main task management page (protected route)
 * Displays user name, sign out button
 * Task creation form and task list
 * Requires authentication
 */

import { useEffect, useState, useRef } from "react";
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
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import Header from "@/components/Header";
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
      {/* Keyboard shortcuts */}
      <KeyboardShortcuts
        onSearchToggle={() => {
          // Find and focus the search bar
          const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }}
        onNewTask={() => setIsTaskFormOpen(true)}
      />

      <Header user={user || undefined} onSignOut={handleSignOut} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Task Creation and List - Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Creation Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
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
