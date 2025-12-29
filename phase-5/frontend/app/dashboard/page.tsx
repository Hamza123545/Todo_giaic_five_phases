"use client";

/**
 * Dashboard Page - Glass Morphism Redesign
 *
 * Main dashboard with statistics, charts, and task overview
 * Preserves all existing data fetching functionality
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePolling } from "@/hooks/usePolling";
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
} from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { api } from "@/lib/api";
import { HeaderGreeting } from "@/components/molecules/HeaderGreeting";
import { StatCard } from "@/components/molecules/StatCard";
import { ChartCard } from "@/components/molecules/ChartCard";
import { ActivityLog, ActivityItem } from "@/components/organisms/ActivityLog";
import { GlassCard } from "@/components/atoms/GlassCard";
import { List, CheckCircle2, TrendingUp, Plus } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function DashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [filter] = useState<TaskFilter>("all");
  const [sortConfig] = useState<SortConfig>({
    key: "created",
    direction: "desc",
  });
  const [searchQuery] = useState("");
  const [pollingEnabled] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

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

        const queryParams: TaskQueryParams = {
          status: filter,
          sort: sortParam,
          search: searchQuery,
          page: 1,
          limit: 100, // Get more tasks for dashboard
        };

        const response = await api.getTasks(userId, queryParams);
        if (response.success && response.data) {
          const tasksList = response.data.items || [];
          setTasks(tasksList);
          setLoadingState("success");

          // Generate activity log from recent tasks
          const recentActivities: ActivityItem[] = tasksList
            .slice(0, 10)
            .map((task) => ({
              id: `activity-${task.id}`,
              type: task.completed ? 'completed' : 'created',
              description: task.completed
                ? `Completed "${task.title}"`
                : `Created "${task.title}"`,
              timestamp: task.updated_at || task.created_at,
            }));
          setActivities(recentActivities);
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
  }, [user, loadTasks]);

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

  // Calculate stats
  const activeTasks = tasks.filter((t) => !t.completed).length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Get high priority tasks for task list
  const highPriorityTasks = tasks
    .filter((t) => !t.completed && t.priority === "high")
    .slice(0, 5);

  // Calculate real chart data from tasks
  const calculateChartData = () => {
    const now = new Date();
    const weeks: { name: string; completed: number; created: number }[] = [];
    
    // Get last 6 weeks
    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekName = `W${6 - i}`;
      
      // Count tasks completed in this week
      const completed = tasks.filter((task) => {
        if (!task.completed || !task.updated_at) return false;
        const updatedDate = new Date(task.updated_at);
        return updatedDate >= weekStart && updatedDate <= weekEnd;
      }).length;
      
      // Count tasks created in this week
      const created = tasks.filter((task) => {
        if (!task.created_at) return false;
        const createdDate = new Date(task.created_at);
        return createdDate >= weekStart && createdDate <= weekEnd;
      }).length;
      
      weeks.push({ name: weekName, completed, created });
    }
    
    return weeks;
  };

  const chartData = calculateChartData();
  const lineChartData = chartData.map((w) => ({ name: w.name, value: w.completed }));
  const barChartData = chartData.map((w) => ({ name: w.name, value: w.created, secondary: w.completed }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" label="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <HeaderGreeting
          userName={user?.name}
          subtitle="Here's what's happening with your tasks today"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Active Tasks"
          value={activeTasks}
          icon={List}
          iconColor="text-indigo-600 dark:text-indigo-400"
          trend={{
            value: totalTasks > 0 ? ((activeTasks / totalTasks) * 100 - 50) : 0,
            direction: activeTasks > completedTasks ? "up" : "down",
            period: "vs completed",
          }}
        />
        <StatCard
          title="Completed Tasks"
          value={completedTasks}
          icon={CheckCircle2}
          iconColor="text-green-600 dark:text-green-400"
          trend={{
            value: completionRate,
            direction: "up",
            period: "completion rate",
          }}
        />
        <StatCard
          title="Total Tasks"
          value={totalTasks}
          icon={TrendingUp}
          iconColor="text-blue-600 dark:text-blue-400"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard title="Task Completion Trends" subtitle="Last 6 weeks">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(156,163,175,0.8)" />
              <YAxis stroke="rgba(156,163,175,0.8)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(31, 41, 55, 0.9)",
                  border: "1px solid rgba(75, 85, 99, 0.5)",
                  borderRadius: "12px",
                  backdropFilter: "blur(24px)",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: "#6366f1" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weekly Task Activity" subtitle="Tasks created vs completed">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(156,163,175,0.8)" />
              <YAxis stroke="rgba(156,163,175,0.8)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(31, 41, 55, 0.9)",
                  border: "1px solid rgba(75, 85, 99, 0.5)",
                  borderRadius: "12px",
                  backdropFilter: "blur(24px)",
                }}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
              <Bar dataKey="secondary" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Activity Log and Task List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityLog activities={activities} loading={loadingState === "loading"} />
        </div>

        <div className="lg:col-span-1">
          <GlassCard variant="elevated" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                High Priority Tasks
              </h3>
              <button
                onClick={() => router.push("/tasks")}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Go to Tasks"
                aria-label="Go to Tasks page"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {highPriorityTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  No high priority tasks
                </div>
              ) : (
                highPriorityTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg bg-white/5 dark:bg-gray-800/5 border border-white/10 dark:border-gray-700/20"
                  >
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                      {task.title}
                    </h4>
                    {task.due_date && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      </div>
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
