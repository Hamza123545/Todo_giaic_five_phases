"use client";

/**
 * Tasks Page - Glass Morphism Redesign with Kanban Layout
 *
 * Displays tasks in Kanban board format (To Do, In Progress, Done)
 * Preserves all existing data fetching functionality
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import ProtectedRoute from "@/components/ProtectedRoute";
import { getCurrentUser } from "@/lib/auth";
import {
  User,
  Task,
  LoadingState,
  TaskQueryParams,
  SortParam,
  TaskFilter,
  SortConfig,
  TaskPriority,
} from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { HeaderGreeting } from "@/components/molecules/HeaderGreeting";
import { TaskKanban } from "@/components/organisms/TaskKanban";
import { TaskFilters } from "@/components/organisms/TaskFilters";
import { TaskCard } from "@/components/molecules/TaskCard";
import { usePolling } from "@/hooks/usePolling";
import TaskForm from "@/components/TaskForm";
import { GlassCard } from "@/components/atoms/GlassCard";
import { X, LayoutGrid, List, Columns3, Download, Upload, Trash2, ChevronRight, ChevronDown, FileText, FileJson, FileSpreadsheet } from "lucide-react";
import { TaskViewMode, ExportFormat } from "@/types";
import { cn } from "@/lib/utils";

function TasksContent() {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('tasks');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [sortConfig] = useState<SortConfig>({
    key: "created",
    direction: "desc",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [pollingEnabled] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [initialStatus, setInitialStatus] = useState<'todo' | 'in-progress' | 'done'>('todo');
  const [selectedPriorities, setSelectedPriorities] = useState<TaskPriority[]>([]);
  const [viewMode, setViewMode] = useState<TaskViewMode>("kanban");
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          const mappedUser: User = {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            createdAt: currentUser.createdAt?.toISOString(),
            updatedAt: currentUser.updatedAt?.toISOString(),
          };
          setUser(mappedUser);
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

  const loadTasks = useCallback(
    async (userId: string, silent: boolean = false) => {
      try {
        if (!silent) {
          setLoadingState("loading");
        }

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

        // Don't filter by priority in API - we'll do it on frontend for instant response
        const queryParams: TaskQueryParams = {
          status: filter,
          sort: sortParam,
          search: searchQuery,
          page: 1,
          limit: 100, // Backend max limit is 100
        };

        const response = await api.getTasks(userId, queryParams);
        if (response.success && response.data) {
          const tasksList = response.data.items || [];
          setTasks(tasksList);
          setLoadingState("success");
        } else {
          throw new Error(response.message || "Failed to load tasks");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Failed to load tasks:", errorMessage);
        if (!silent) {
          setLoadingState("error");
        }
      }
    },
    [filter, sortConfig, searchQuery]
  );

  useEffect(() => {
    if (user) {
      loadTasks(user.id);
    }
    // loadTasks is stable (useCallback with dependencies), so we only need user
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  usePolling(
    async () => {
      if (user && pollingEnabled) {
        await loadTasks(user.id, true);
      }
    },
    {
      interval: 5000,
      enabled: pollingEnabled && !!user,
    }
  );

  const handleTaskUpdate = async (taskId: number, updates: Partial<Task>) => {
    if (!user) return;

    try {
      // If updating completed status, use toggleTaskComplete
      if ('completed' in updates && updates.completed !== undefined) {
        const response = await api.toggleTaskComplete(user.id, taskId, updates.completed);
        if (response.success) {
          await loadTasks(user.id, true);
          toast({
            type: "success",
            description: updates.completed ? t('messages.completed') : t('messages.incomplete'),
            duration: 2000,
          });
          return;
        } else {
          throw new Error(response.message || t('messages.update_failed'));
        }
      }

      // For other updates, use updateTask
      const response = await api.updateTask(user.id, taskId, updates);
      if (response.success) {
        await loadTasks(user.id, true);
        toast({
          type: "success",
          description: t('messages.updated'),
          duration: 2000,
        });
      } else {
        throw new Error(response.message || t('messages.update_failed'));
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      toast({
        type: "error",
        title: t('messages.update_failed'),
        description: error instanceof Error ? error.message : t('messages.something_wrong'),
        duration: 5000,
      });
    }
  };

  const handleTaskDelete = async (taskId: number) => {
    if (!user) return;

    try {
      const response = await api.deleteTask(user.id, taskId);
      if (response.success) {
        await loadTasks(user.id, true);
        toast({
          type: "success",
          description: t('messages.deleted'),
          duration: 2000,
        });
      } else {
        throw new Error(response.message || t('messages.delete_failed'));
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast({
        type: "error",
        title: t('messages.delete_failed'),
        description: error instanceof Error ? error.message : t('messages.something_wrong'),
        duration: 5000,
      });
    }
  };

  const handleTaskClick = (_taskId: number) => {
    // Navigate to task detail or open modal
    router.push(`/dashboard`);
  };

  const handleAddTask = (status: 'todo' | 'in-progress' | 'done') => {
    // Open modal to create task with the selected status
    setInitialStatus(status);
    setShowCreateModal(true);
  };

  const handleTaskCreated = async (newTask: Task) => {
    // If task was created for "done" status, mark it as completed
    if (initialStatus === 'done' && user && newTask.id) {
      try {
        await api.toggleTaskComplete(user.id, newTask.id, true);
      } catch (error) {
        console.error('Failed to mark task as completed:', error);
      }
    }
    
    // Reload tasks after creation
    if (user) {
      await loadTasks(user.id, true);
    }
    setShowCreateModal(false);
    toast({
      type: "success",
      description: t('messages.created'),
      duration: 2000,
    });
  };

  const handleTaskCreateError = (error: Error) => {
    toast({
      type: "error",
      title: t('messages.create_failed'),
      description: error.message || t('messages.create_failed'),
      duration: 5000,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" label={t('loading')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <HeaderGreeting
            userName={user?.name}
            title={t('page_title')}
            subtitle={t('page_subtitle')}
          />
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === "list"
                  ? "bg-indigo-600 text-white"
                  : "bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20"
              )}
              aria-label={t('view_modes.list')}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === "grid"
                  ? "bg-indigo-600 text-white"
                  : "bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20"
              )}
              aria-label={t('view_modes.grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === "kanban"
                  ? "bg-indigo-600 text-white"
                  : "bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20"
              )}
              aria-label={t('view_modes.kanban')}
            >
              <Columns3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side - Filters and Tasks */}
        <div className="flex-1">
          {/* Filters */}
          <div className="mb-6">
            <TaskFilters
              currentFilter={filter}
              onFilterChange={setFilter}
              onSearchChange={setSearchQuery}
              totalCount={
                selectedPriorities.length > 0
                  ? tasks.filter(task => selectedPriorities.includes(task.priority)).length
                  : tasks.length
              }
              searchQuery={searchQuery}
              onPriorityFilter={setSelectedPriorities}
              selectedPriorities={selectedPriorities}
            />
          </div>

          {/* Task View - Kanban, List, or Grid */}
          {viewMode === "kanban" ? (
            <TaskKanban
              tasks={
                selectedPriorities.length > 0
                  ? tasks.filter(task => selectedPriorities.includes(task.priority))
                  : tasks
              }
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
              onTaskClick={handleTaskClick}
              onAddTask={handleAddTask}
              loading={loadingState === "loading"}
            />
          ) : (
            <div className="space-y-4">
              {loadingState === "loading" ? (
                <div className="text-center py-12 text-muted-foreground">{t('loading')}</div>
              ) : (
                <div className={cn(
                  viewMode === "grid" 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    : "space-y-4"
                )}>
                  {(selectedPriorities.length > 0
                    ? tasks.filter(task => selectedPriorities.includes(task.priority))
                    : tasks
                  ).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdate={handleTaskUpdate}
                      onDelete={handleTaskDelete}
                      onClick={handleTaskClick}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side - Quick Actions Sidebar */}
        <div className="lg:w-64 shrink-0">
          <GlassCard variant="elevated" className="p-4 sticky top-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">{t('quick_actions.title')}</h3>
            <div className="space-y-2.5">
            {/* Export Button with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg",
                  "backdrop-blur-sm border border-gray-700/50 dark:border-gray-600/50",
                  "bg-gray-800/90 dark:bg-gray-900/90",
                  "text-white hover:bg-gray-700/90 dark:hover:bg-gray-800/90",
                  "transition-all duration-200 shadow-md hover:shadow-lg",
                  "hover:border-gray-600 dark:hover:border-gray-500"
                )}
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span className="font-medium text-sm">{t('quick_actions.export')}</span>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  showExportDropdown && "rotate-180"
                )} />
              </button>
              {showExportDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-[100]"
                    onClick={() => setShowExportDropdown(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-2 z-[101] rounded-lg overflow-hidden shadow-2xl backdrop-blur-xl border border-white/20 dark:border-gray-700/50 bg-white/20 dark:bg-gray-900/95 space-y-1.5 p-1.5">
                    {(["json", "csv", "pdf"] as ExportFormat[]).map((format) => {
                      const formatConfig = {
                        json: { 
                          icon: FileJson, 
                          label: "JSON", 
                          bgColor: "bg-purple-600/90 dark:bg-purple-700/90",
                          hoverColor: "hover:bg-purple-600 dark:hover:bg-purple-600",
                          iconColor: "text-yellow-300"
                        },
                        csv: { 
                          icon: FileSpreadsheet, 
                          label: "CSV", 
                          bgColor: "bg-red-600/90 dark:bg-red-700/90",
                          hoverColor: "hover:bg-red-600 dark:hover:bg-red-600",
                          iconColor: "text-green-300"
                        },
                        pdf: { 
                          icon: FileText, 
                          label: "PDF", 
                          bgColor: "bg-red-600/90 dark:bg-red-700/90",
                          hoverColor: "hover:bg-red-600 dark:hover:bg-red-600",
                          iconColor: "text-red-300"
                        },
                      }[format];
                      const Icon = formatConfig.icon;
                      return (
                        <button
                          key={format}
                          onClick={async () => {
                            setShowExportDropdown(false);
                            if (!user) return;
                            try {
                              const blob = await api.exportTasks(user.id, format);
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `tasks-${new Date().toISOString().split("T")[0]}.${format}`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              window.URL.revokeObjectURL(url);
                              toast({
                                type: "success",
                                description: t('export.success', { format: formatConfig.label }),
                                duration: 2000,
                              });
                            } catch (error) {
                              console.error("Export failed:", error);
                              toast({
                                type: "error",
                                description: error instanceof Error ? error.message : t('export.failed'),
                                duration: 5000,
                              });
                            }
                          }}
                          className={cn(
                            "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg",
                            "text-white transition-all duration-200 shadow-md hover:shadow-lg",
                            formatConfig.bgColor,
                            formatConfig.hoverColor,
                            "hover:scale-[1.01] active:scale-[0.99]"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={cn("w-4 h-4", formatConfig.iconColor)} />
                            <span className="font-medium text-sm">{t(`export.${format}`)}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-70" />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Import Tasks Button */}
            <label className={cn(
              "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg cursor-pointer",
              "backdrop-blur-sm border border-indigo-600/50 dark:border-indigo-500/50",
              "bg-indigo-600/85 dark:bg-indigo-700/85",
              "text-white hover:bg-indigo-600 dark:hover:bg-indigo-600",
              "transition-all duration-200 shadow-md hover:shadow-lg",
              "hover:border-indigo-500 dark:hover:border-indigo-400",
              "hover:scale-[1.01] active:scale-[0.99]"
            )}>
              <input
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user) return;
                  try {
                    const result = await api.importTasks(user.id, file);
                    if (result.success) {
                      await loadTasks(user.id, true);
                      toast({
                        type: "success",
                        description: t('import.success', { count: result.data?.imported || 0 }),
                        duration: 2000,
                      });
                    } else {
                      throw new Error(result.message || t('import.failed'));
                    }
                  } catch (error) {
                    console.error("Import failed:", error);
                    toast({
                      type: "error",
                      description: error instanceof Error ? error.message : t('import.failed'),
                      duration: 5000,
                    });
                  }
                  e.target.value = "";
                }}
              />
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span className="font-medium text-sm">{t('quick_actions.import')}</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </label>

            {/* Clear Completed Button */}
            <button
              onClick={async () => {
                if (!user) return;
                const completedTasks = tasks.filter(task => task.completed);
                if (completedTasks.length === 0) {
                  toast({
                    type: "info",
                    description: t('clear.no_completed'),
                    duration: 2000,
                  });
                  return;
                }
                if (!confirm(t('clear.confirm', { count: completedTasks.length }))) {
                  return;
                }
                try {
                  const taskIds = completedTasks.map(task => task.id);
                  const response = await api.bulkDeleteTasks(user.id, taskIds);
                  if (response.success) {
                    await loadTasks(user.id, true);
                    toast({
                      type: "success",
                      description: t('clear.success', { count: response.data?.deleted || 0 }),
                      duration: 2000,
                    });
                  } else {
                    throw new Error(response.message || t('clear.failed'));
                  }
                } catch (error) {
                  console.error("Clear completed failed:", error);
                  toast({
                    type: "error",
                    description: error instanceof Error ? error.message : t('clear.failed'),
                    duration: 5000,
                  });
                }
              }}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg",
                "backdrop-blur-sm border border-red-600/50 dark:border-red-500/50",
                "bg-red-600/85 dark:bg-red-700/85",
                "text-white hover:bg-red-600 dark:hover:bg-red-600",
                "transition-all duration-200 shadow-md hover:shadow-lg",
                "hover:border-red-500 dark:hover:border-red-400",
                "hover:scale-[1.01] active:scale-[0.99]"
              )}
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span className="font-medium text-sm text-red-50">{t('quick_actions.clear_completed')}</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>
          </div>
        </GlassCard>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <GlassCard variant="elevated" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {t('create_new_task')}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <TaskForm
                userId={user.id}
                onSuccess={handleTaskCreated}
                onError={handleTaskCreateError}
                onCancel={() => setShowCreateModal(false)}
                initialData={undefined}
                submitLabel={t('create_task')}
              />
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <ProtectedRoute>
      <TasksContent />
    </ProtectedRoute>
  );
}

