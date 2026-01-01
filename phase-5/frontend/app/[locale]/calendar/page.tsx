"use client";

/**
 * Calendar Page - Glass Morphism Redesign
 *
 * Monthly calendar view with task events
 */

import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import { User, Task } from "@/types";
import ProtectedRoute from "@/components/ProtectedRoute";
import { HeaderGreeting } from "@/components/molecules/HeaderGreeting";
import { GlassCard } from "@/components/atoms/GlassCard";
import { api } from "@/lib/api";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function CalendarContent() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
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

          // Load tasks (backend max limit is 100)
          const response = await api.getTasks(mappedUser.id, { limit: 100 });
          if (response.success && response.data) {
            setTasks(response.data.items || []);
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getTasksForDay = (day: number) => {
    if (!day) return [];
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return tasks.filter((task) => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <HeaderGreeting
          userName={user?.name}
          title="Calendar"
          subtitle="View your tasks by date"
        />
      </div>

      <div className="max-w-6xl mx-auto">
        <GlassCard variant="elevated" className="p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              ←
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-gray-600 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {days.map((day, idx) => {
              const dayTasks = getTasksForDay(day || 0);
              const today = isToday(day);

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-[100px] p-2 rounded-lg border transition-colors",
                    day
                      ? "glass-card border-white/20 dark:border-gray-700/50 hover:bg-white/5"
                      : "border-transparent",
                    today && "ring-2 ring-indigo-500 bg-indigo-500/10"
                  )}
                >
                  {day && (
                    <>
                      <div
                        className={cn(
                          "text-sm font-medium mb-1",
                          today
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-gray-900 dark:text-gray-100"
                        )}
                      >
                        {day}
                      </div>
                      {dayTasks.length > 0 && (
                        <div className="space-y-1">
                          {dayTasks.slice(0, 2).map((task) => (
                            <div
                              key={task.id}
                              className="text-xs p-1 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 truncate"
                            >
                              {task.title}
                            </div>
                          ))}
                          {dayTasks.length > 2 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              +{dayTasks.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <CalendarContent />
    </ProtectedRoute>
  );
}

