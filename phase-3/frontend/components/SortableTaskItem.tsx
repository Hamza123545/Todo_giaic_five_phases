"use client";

/**
 * SortableTaskItem Component
 *
 * A wrapper component for TaskItem that adds drag-and-drop functionality
 * Uses @dnd-kit/sortable for smooth animations and accessibility
 */

import { Task } from "@/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskItem from "./TaskItem";
import { cn } from "@/lib/utils";

interface SortableTaskItemProps {
  task: Task;
  userId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  isDragging?: boolean;
}

export function SortableTaskItem({
  task,
  userId,
  onSuccess,
  onError,
  isDragging = false,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentlyDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative list-none",
        isCurrentlyDragging && "opacity-50 z-50",
        isDragging && "cursor-grabbing"
      )}
    >
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className={cn(
            "shrink-0 p-2 rounded cursor-grab active:cursor-grabbing",
            "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "dark:focus:ring-offset-gray-900",
            "transition-colors duration-200"
          )}
          aria-label="Drag to reorder task"
          tabIndex={0}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="9" cy="5" r="1" />
            <circle cx="9" cy="12" r="1" />
            <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="5" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="15" cy="19" r="1" />
          </svg>
        </button>

        {/* Task Item */}
        <div className="flex-1 min-w-0">
          <TaskItem task={task} userId={userId} onSuccess={onSuccess} onError={onError} />
        </div>
      </div>
    </li>
  );
}
