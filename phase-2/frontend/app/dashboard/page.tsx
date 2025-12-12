"use client";

/**
 * Dashboard Page
 *
 * Main task management page (protected route)
 * Displays user name, sign out button
 * Task creation form and task list
 * Requires authentication
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { usePolling } from "@/hooks/usePolling";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getCurrentUser, signOut } from "@/lib/auth";
import {
  User,
  Task,
  LoadingState,
  TaskQueryParams,
  SortParam,
  TaskFilter,
  SortConfig,
  TaskViewMode,
} from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";
import FilterControls from "@/components/FilterControls";
import SortControls from "@/components/SortControls";
import SearchBar from "@/components/SearchBar";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import DashboardHeader from "@/components/DashboardHeader";
import PaginationControls from "@/components/PaginationControls";
import ExportDropdown from "@/components/ExportDropdown";
import { api } from "@/lib/api";

function DashboardContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "created",
    direction: "desc",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<TaskViewMode>("list");

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
            createdAt: currentUser.createdAt?.toISOString(),
            updatedAt: currentUser.updatedAt?.toISOString(),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTasks = useCallback(
    async (userId: string, silent: boolean = false) => {
      try {
        // Only show loading state if not a background refresh
        if (!silent) {
          setLoadingState("loading");
        }

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
          page: currentPage,
          limit: itemsPerPage,
        };

        const response = await api.getTasks(userId, queryParams);
        console.log("Tasks API response:", response); // Debug log
        if (response.success && response.data) {
          // Backend now returns: { success: true, data: { items: Task[], total, page, limit, totalPages } }
          const tasksList = response.data.items || [];
          const total = response.data.total || 0;
          const totalPages = response.data.totalPages || 1;

          console.log("Setting tasks:", tasksList, "Total:", total, "Pages:", totalPages); // Debug log
          setTasks(tasksList);
          setTotalItems(total);
          setTotalPages(totalPages);
          setLoadingState("success");
        } else {
          console.error("Failed to load tasks - response:", response); // Debug log
          throw new Error(response.message || "Failed to load tasks");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Failed to load tasks:", errorMessage, error);
        if (!silent) {
          setLoadingState("error");
        }
      }
    },
    [filter, sortConfig, searchQuery, currentPage, itemsPerPage]
  );

  // Load tasks when filter, sort, search, or pagination changes
  useEffect(() => {
    if (user) {
      loadTasks(user.id);
    }
  }, [user, loadTasks]);

  // Set up polling for real-time updates
  usePolling(
    async () => {
      if (user && pollingEnabled) {
        await loadTasks(user.id, true); // Silent refresh
      }
    },
    {
      interval: 30000, // Poll every 30 seconds
      enabled: pollingEnabled && !!user,
    }
  );

  const handleTaskCreated = async (newTask: Task) => {
    // Reload tasks from server to ensure consistency
    if (user) {
      await loadTasks(user.id);
    }
    setIsTaskFormOpen(false);
    toast({
      type: "success",
      title: "Task Created",
      description: `"${newTask.title}" has been added to your tasks.`,
      duration: 3000,
    });
  };

  const handleTaskUpdated = () => {
    // Reload tasks to get the latest data
    if (user) {
      loadTasks(user.id);
    }
    toast({
      type: "success",
      description: "Task updated successfully",
      duration: 2000,
    });
  };

  const handleTaskError = (error: Error) => {
    console.error("Task operation error:", error);
    toast({
      type: "error",
      title: "Operation Failed",
      description: error.message || "Something went wrong",
      duration: 5000,
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/signin");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleSortChange = (
    key: "created" | "title" | "updated" | "priority" | "due_date",
    direction?: "asc" | "desc"
  ) => {
    setSortConfig((prev) => ({
      key,
      direction: direction || (prev.key === key && prev.direction === "asc" ? "desc" : "asc"),
    }));
    setCurrentPage(1); // Reset to first page when sort changes
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleFilterChange = (newFilter: TaskFilter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const handleImportTasks = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.csv";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !user) return;

      try {
        const response = await api.importTasks(user.id, file);
        if (response.success) {
          // Reload tasks after import
          await loadTasks(user.id);
          toast({
            type: "success",
            title: "Import Successful",
            description: `Tasks imported successfully`,
            duration: 3000,
          });
        } else {
          throw new Error(response.message || "Import failed");
        }
      } catch (error) {
        console.error("Import failed:", error);
        handleTaskError(error instanceof Error ? error : new Error("Import failed"));
      }
    };
    input.click();
  };

  const handleClearCompleted = async () => {
    if (!user) return;
    if (
      !confirm("Are you sure you want to delete all completed tasks? This action cannot be undone.")
    ) {
      return;
    }

    try {
      const completedTasks = tasks.filter((t) => t.completed);
      for (const task of completedTasks) {
        await api.deleteTask(user.id, task.id);
      }
      // Reload tasks after deletion
      await loadTasks(user.id);
    } catch (error) {
      console.error("Clear completed failed:", error);
      handleTaskError(error instanceof Error ? error : new Error("Clear completed failed"));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" label="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
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

      <DashboardHeader user={user || undefined} onSignOut={handleSignOut} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}! 👋
          </h1>
          <p className="mt-2 text-muted-foreground">Manage your tasks and stay productive</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 md:gap-8">
          {/* Task Creation and List - Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Creation Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-black/5 backdrop-blur-sm"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
              <div className="relative p-6 sm:p-8">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      {isTaskFormOpen ? "Create New Task" : "Quick Add Task"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {isTaskFormOpen
                        ? "Fill in the details below to create a new task"
                        : "Click the button below to add a new task to your list"}
                    </p>
                  </div>
                  {!isTaskFormOpen && (
                    <motion.button
                      onClick={() => setIsTaskFormOpen(true)}
                      whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(37, 99, 235, 0.3)" }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      <span className="text-lg">+</span>
                      Add Task
                    </motion.button>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {isTaskFormOpen ? (
                    <motion.div
                      key="task-form"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TaskForm
                        userId={user?.id || ""}
                        onSuccess={handleTaskCreated}
                        onError={handleTaskError}
                        onCancel={() => setIsTaskFormOpen(false)}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-12 text-center"
                    >
                      <div>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-3xl text-primary">+</span>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Click &quot;Add Task&quot; to create a new task
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Task List with Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-black/5 backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
              <div className="relative p-6 sm:p-8">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        Your Tasks
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {tasks.length} {tasks.length === 1 ? "task" : "tasks"} total
                      </p>
                    </div>
                    {/* Real-time updates indicator */}
                    <motion.button
                      type="button"
                      onClick={() => setPollingEnabled(!pollingEnabled)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                        pollingEnabled
                          ? "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border border-green-500/20"
                          : "bg-muted text-muted-foreground border border-border"
                      )}
                      aria-label={pollingEnabled ? "Auto-refresh enabled" : "Auto-refresh disabled"}
                      title={
                        pollingEnabled
                          ? "Auto-refresh enabled (every 30s)"
                          : "Auto-refresh disabled"
                      }
                    >
                      <motion.span
                        animate={pollingEnabled ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 1, repeat: pollingEnabled ? Infinity : 0 }}
                        className={cn(
                          "h-2 w-2 rounded-full",
                          pollingEnabled ? "bg-green-500" : "bg-muted-foreground"
                        )}
                      />
                      {pollingEnabled ? "Live" : "Off"}
                    </motion.button>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <FilterControls
                      currentFilter={filter}
                      onFilterChange={handleFilterChange}
                      taskCounts={{
                        all: tasks.length,
                        pending: tasks.filter((t) => !t.completed).length,
                        completed: tasks.filter((t) => t.completed).length,
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
                <div className="mb-6">
                  <SearchBar onSearch={handleSearchChange} placeholder="Search tasks..." />
                </div>

                {/* Task List */}
                <TaskList
                  tasks={tasks}
                  userId={user?.id || ""}
                  onTaskChange={handleTaskUpdated}
                  onError={handleTaskError}
                  isLoading={loadingState === "loading"}
                  viewMode={viewMode}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6">
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={handlePageChange}
                      onItemsPerPageChange={handleItemsPerPageChange}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Statistics and Filters - Right Column (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="relative overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-black/5 backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
              <div className="relative p-6">
                <h2 className="mb-6 text-xl font-bold tracking-tight text-foreground">
                  Statistics
                </h2>
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="group relative overflow-hidden rounded-lg border border-border bg-muted/30 p-4 transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                        <motion.span
                          key={tasks.length}
                          initial={{ scale: 1.2, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="mt-1 block text-3xl font-bold text-foreground"
                        >
                          {tasks.length}
                        </motion.span>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <span className="text-xl">📋</span>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="group relative overflow-hidden rounded-lg border border-border bg-yellow-500/10 p-4 transition-all hover:border-yellow-500/50 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pending</p>
                        <motion.span
                          key={`pending-${tasks.filter((t) => !t.completed).length}`}
                          initial={{ scale: 1.2, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="mt-1 block text-3xl font-bold text-yellow-600 dark:text-yellow-400"
                        >
                          {tasks.filter((t) => !t.completed).length}
                        </motion.span>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                        <span className="text-xl">⏳</span>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="group relative overflow-hidden rounded-lg border border-border bg-green-500/10 p-4 transition-all hover:border-green-500/50 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Completed</p>
                        <motion.span
                          key={`completed-${tasks.filter((t) => t.completed).length}`}
                          initial={{ scale: 1.2, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="mt-1 block text-3xl font-bold text-green-600 dark:text-green-400"
                        >
                          {tasks.filter((t) => t.completed).length}
                        </motion.span>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                        <span className="text-xl">✅</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-black/5 backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
              <div className="relative p-6">
                <h2 className="mb-6 text-xl font-bold tracking-tight text-foreground">
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  {user && <ExportDropdown userId={user.id} className="w-full" />}
                  <motion.button
                    type="button"
                    onClick={handleImportTasks}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 text-left text-sm font-medium text-foreground transition-all hover:border-primary/50 hover:bg-muted/50 hover:shadow-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span>📥</span>
                      Import Tasks
                    </span>
                    <span className="text-muted-foreground">→</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleClearCompleted}
                    disabled={tasks.filter((t) => t.completed).length === 0}
                    whileHover={
                      tasks.filter((t) => t.completed).length > 0 ? { scale: 1.02, x: 4 } : {}
                    }
                    whileTap={{ scale: 0.98 }}
                    className="flex w-full items-center justify-between rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-left text-sm font-medium text-destructive transition-all hover:border-destructive/50 hover:bg-destructive/20 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <span>🗑️</span>
                      Clear Completed
                    </span>
                    <span className="text-muted-foreground">→</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* View Options */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="relative overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-black/5 backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
              <div className="relative p-6">
                <h2 className="mb-6 text-xl font-bold tracking-tight text-foreground">
                  View Options
                </h2>
                <div className="space-y-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-all",
                      viewMode === "list"
                        ? "bg-primary/10 text-primary border-2 border-primary/20 shadow-sm"
                        : "border border-border bg-muted/30 text-foreground hover:border-primary/50 hover:bg-muted/50"
                    )}
                    onClick={() => setViewMode("list")}
                  >
                    <span className="flex items-center gap-2">
                      <span>📝</span>
                      List View
                    </span>
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-all",
                      viewMode === "grid"
                        ? "bg-primary/10 text-primary border-2 border-primary/20 shadow-sm"
                        : "border border-border bg-muted/30 text-foreground hover:border-primary/50 hover:bg-muted/50"
                    )}
                    onClick={() => setViewMode("grid")}
                  >
                    <span className="flex items-center gap-2">
                      <span>🔲</span>
                      Grid View
                    </span>
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-all",
                      viewMode === "kanban"
                        ? "bg-primary/10 text-primary border-2 border-primary/20 shadow-sm"
                        : "border border-border bg-muted/30 text-foreground hover:border-primary/50 hover:bg-muted/50"
                    )}
                    onClick={() => setViewMode("kanban")}
                  >
                    <span className="flex items-center gap-2">
                      <span>📊</span>
                      Kanban View
                    </span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
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
