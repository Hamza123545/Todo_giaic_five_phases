"use client";

/**
 * TaskList Component
 *
 * Displays a list of tasks with filtering, sorting, and loading states
 * Supports different view modes (list, grid, kanban)
 * Includes drag-and-drop reordering functionality
 * Enhanced with Framer Motion animations
 */

import { Task } from "@/types";
import { cn } from "@/lib/utils";
import { memo, useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TaskItem from "./TaskItem";
import LoadingSpinner from "./LoadingSpinner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableTaskItem } from "./SortableTaskItem";
import { api } from "@/lib/api";

interface TaskListProps {
  tasks: Task[];
  userId: string;
  isLoading?: boolean;
  onTaskChange?: () => void;
  onError?: (error: Error) => void;
  viewMode?: "list" | "grid" | "kanban";
  emptyMessage?: string;
  className?: string;
  enableDragAndDrop?: boolean;
}

const TaskList = memo(function TaskList({
  tasks,
  userId,
  isLoading = false,
  onTaskChange,
  onError,
  viewMode = "list",
  emptyMessage = "No tasks found. Create your first task to get started!",
  className,
  enableDragAndDrop = true,
}: TaskListProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Update local tasks when props change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px drag distance before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number);
    setIsDragging(true);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setIsDragging(false);
      setActiveId(null);

      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = localTasks.findIndex((task) => task.id === active.id);
      const newIndex = localTasks.findIndex((task) => task.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      // Optimistic update
      const newTasks = arrayMove(localTasks, oldIndex, newIndex);
      setLocalTasks(newTasks);

      // Persist to backend
      try {
        const taskIds = newTasks.map((task) => task.id);
        await api.reorderTasks(userId, taskIds);
        onTaskChange?.();
      } catch (error) {
        // Revert on error
        setLocalTasks(tasks);
        onError?.(error as Error);
      }
    },
    [localTasks, tasks, userId, onTaskChange, onError]
  );

  const activeTask = useMemo(
    () => localTasks.find((task) => task.id === activeId),
    [activeId, localTasks]
  );

  // Memoize computed values
  const { pendingTasks, completedTasks } = useMemo(() => {
    if (viewMode === "kanban") {
      return {
        pendingTasks: tasks.filter((task) => !task.completed),
        completedTasks: tasks.filter((task) => task.completed),
      };
    }
    return { pendingTasks: [], completedTasks: [] };
  }, [tasks, viewMode]);

  // Memoize list items to prevent unnecessary re-renders
  const listItems = useMemo(() => {
    const taskIds = localTasks.map((task) => task.id);

    if (enableDragAndDrop && viewMode === "list") {
      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            <ul
              className={cn("space-y-3", className)}
              role="list"
              aria-label="Task list with drag-and-drop reordering"
            >
              {localTasks.map((task) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  userId={userId}
                  onSuccess={onTaskChange}
                  onError={onError}
                  isDragging={isDragging}
                />
              ))}
            </ul>
          </SortableContext>
          <DragOverlay>
            {activeTask ? (
              <div className="opacity-50">
                <TaskItem
                  task={activeTask}
                  userId={userId}
                  onSuccess={onTaskChange}
                  onError={onError}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      );
    }

    return (
      <ul className={cn("space-y-3", className)} role="list" aria-label="Task list">
        {localTasks.map((task) => (
          <li key={task.id}>
            <TaskItem task={task} userId={userId} onSuccess={onTaskChange} onError={onError} />
          </li>
        ))}
      </ul>
    );
  }, [
    localTasks,
    userId,
    onTaskChange,
    onError,
    className,
    enableDragAndDrop,
    viewMode,
    sensors,
    isDragging,
    activeTask,
    handleDragStart,
    handleDragEnd,
  ]);

  const gridItems = useMemo(
    () => (
      <motion.div
        className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}
        role="list"
        aria-label="Task grid"
      >
        <AnimatePresence mode="popLayout">
          {localTasks.map((task, index) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <TaskItem
                task={task}
                userId={userId}
                onSuccess={onTaskChange}
                onError={onError}
                viewMode="card"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    ),
    [localTasks, userId, onTaskChange, onError, className]
  );

  const kanbanView = useMemo(
    () => (
      <div
        className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", className)}
        role="region"
        aria-label="Kanban board"
      >
        {/* Pending Column */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full" aria-hidden="true"></span>
            Pending ({pendingTasks.length})
          </h3>
          <div
            className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg min-h-[200px]"
            role="list"
            aria-label="Pending tasks"
          >
            {pendingTasks.length > 0 ? (
              pendingTasks.map((task) => (
                <div key={task.id}>
                  <TaskItem
                    task={task}
                    userId={userId}
                    onSuccess={onTaskChange}
                    onError={onError}
                    viewMode="card"
                  />
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No pending tasks</p>
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full" aria-hidden="true"></span>
            Completed ({completedTasks.length})
          </h3>
          <div
            className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg min-h-[200px]"
            role="list"
            aria-label="Completed tasks"
          >
            {completedTasks.length > 0 ? (
              completedTasks.map((task) => (
                <div key={task.id}>
                  <TaskItem
                    task={task}
                    userId={userId}
                    onSuccess={onTaskChange}
                    onError={onError}
                    viewMode="card"
                  />
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No completed tasks
              </p>
            )}
          </div>
        </div>
      </div>
    ),
    [completedTasks, pendingTasks, userId, onTaskChange, onError, className]
  );

  // Loading state
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        role="status"
        aria-live="polite"
        aria-label="Loading tasks"
      >
        <LoadingSpinner size="large" label="Loading tasks..." />
      </div>
    );
  }

  // Empty state - check localTasks instead of tasks prop
  if (!localTasks || localTasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center py-12 text-gray-500 dark:text-gray-400"
        role="status"
        aria-live="polite"
      >
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg"
        >
          {emptyMessage}
        </motion.p>
      </motion.div>
    );
  }

  // Render based on selected view mode
  switch (viewMode) {
    case "grid":
      return gridItems;
    case "kanban":
      return kanbanView;
    case "list":
    default:
      return listItems;
  }
});

export default TaskList;
