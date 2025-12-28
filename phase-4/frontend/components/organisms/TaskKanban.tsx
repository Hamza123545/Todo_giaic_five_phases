'use client';

import { Task } from '@/types';
import { TaskCard } from '@/components/molecules/TaskCard';
import { GlassCard } from '@/components/atoms/GlassCard';
import { getTaskColumn, KANBAN_COLUMNS, TASK_STATUS_MAP } from '@/lib/task-status';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TaskKanbanProps {
  tasks: Task[];
  onTaskUpdate?: (taskId: number, updates: Partial<Task>) => void;
  onTaskDelete?: (taskId: number) => void;
  onTaskClick?: (taskId: number) => void;
  onAddTask?: (status: 'todo' | 'in-progress' | 'done') => void;
  loading?: boolean;
}

export function TaskKanban({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onTaskClick,
  onAddTask,
  loading = false,
}: TaskKanbanProps) {
  // Group tasks by status
  const tasksByStatus = {
    todo: tasks.filter((t) => getTaskColumn(t) === 'todo'),
    'in-progress': tasks.filter((t) => getTaskColumn(t) === 'in-progress'),
    done: tasks.filter((t) => getTaskColumn(t) === 'done'),
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {KANBAN_COLUMNS.map((status) => (
          <GlassCard key={status} variant="elevated" className="p-4">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </GlassCard>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((status) => {
        const columnTasks = tasksByStatus[status];
        const count = columnTasks.length;

        return (
          <div key={status} className="flex flex-col min-w-[300px]">
            <GlassCard variant="elevated" className="p-4 flex-1 flex flex-col">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {TASK_STATUS_MAP[status]}
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                    {count}
                  </span>
                </div>
                {onAddTask && (
                  <button
                    onClick={() => onAddTask(status)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label={`Add task to ${TASK_STATUS_MAP[status]}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Tasks */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px]">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                    No tasks
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdate={onTaskUpdate}
                      onDelete={onTaskDelete}
                      onClick={onTaskClick}
                    />
                  ))
                )}
              </div>
            </GlassCard>
          </div>
        );
      })}
    </div>
  );
}

