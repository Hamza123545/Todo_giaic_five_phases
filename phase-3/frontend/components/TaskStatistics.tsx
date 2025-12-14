/**
 * TaskStatistics Component
 *
 * Displays task statistics dashboard with:
 * - Total tasks count
 * - Completed tasks count and percentage
 * - Pending tasks count and percentage
 * - Overdue tasks count and percentage
 *
 * Updates in real-time as tasks change
 * Responsive design with visual indicators
 */

"use client";

import React, { useMemo } from "react";
import { Task } from "@/types";
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";

interface TaskStatisticsProps {
  tasks: Task[];
  className?: string;
}

interface StatCard {
  label: string;
  count: number;
  percentage: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export function TaskStatistics({ tasks, className = "" }: TaskStatisticsProps) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const pending = tasks.filter((task) => !task.completed).length;

    // Calculate overdue tasks (pending tasks with past due_date)
    const now = new Date();
    const overdue = tasks.filter((task) => {
      if (task.completed || !task.due_date) return false;
      const dueDate = new Date(task.due_date);
      return dueDate < now;
    }).length;

    const completedPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const pendingPercentage = total > 0 ? Math.round((pending / total) * 100) : 0;
    const overduePercentage = total > 0 ? Math.round((overdue / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      overdue,
      completedPercentage,
      pendingPercentage,
      overduePercentage,
    };
  }, [tasks]);

  const statCards: StatCard[] = [
    {
      label: "Total Tasks",
      count: stats.total,
      percentage: 100,
      icon: <Circle className="w-5 h-5" />,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Completed",
      count: stats.completed,
      percentage: stats.completedPercentage,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: "Pending",
      count: stats.pending,
      percentage: stats.pendingPercentage,
      icon: <Clock className="w-5 h-5" />,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      label: "Overdue",
      count: stats.overdue,
      percentage: stats.overduePercentage,
      icon: <AlertCircle className="w-5 h-5" />,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
  ];

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
      role="region"
      aria-label="Task Statistics"
    >
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className={`${stat.bgColor} rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.count}</p>
            </div>
            <div className={`${stat.color} ${stat.bgColor} p-2 rounded-lg`}>{stat.icon}</div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {stat.percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${stat.color.replace("text-", "bg-")} transition-all duration-300 ease-out`}
                style={{ width: `${stat.percentage}%` }}
                role="progressbar"
                aria-valuenow={stat.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${stat.label} progress`}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TaskStatistics;
