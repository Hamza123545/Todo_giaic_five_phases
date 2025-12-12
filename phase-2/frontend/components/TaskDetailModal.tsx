/**
 * TaskDetailModal Component
 *
 * Modal dialog for viewing and editing complete task details
 * Features:
 * - Full task information display
 * - Inline editing of all task fields
 * - Activity history (created/updated timestamps)
 * - Close on backdrop click or Escape key
 * - Accessible with proper ARIA labels
 */

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Task, TaskFormData, TaskPriority } from "@/types";
import { X, Calendar, Tag, AlertCircle, Clock, Edit2, Check } from "lucide-react";
import { Button } from "./ui/button";

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (taskId: number, data: Partial<TaskFormData>) => Promise<void>;
  isLoading?: boolean;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdate,
  isLoading = false,
}: TaskDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<TaskFormData>>({});

  // Reset edit state when task changes or modal closes
  useEffect(() => {
    if (!isOpen || !task) {
      // Use setTimeout to avoid setState in effect
      setTimeout(() => {
        setIsEditing(false);
        setEditedData({});
      }, 0);
    }
  }, [isOpen, task]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setIsEditing(false);
      setEditedData({});
      onClose();
    }
  }, [isLoading, onClose]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleEdit = () => {
    if (task) {
      setEditedData({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        due_date: task.due_date || "",
        tags: task.tags || [],
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (task && onUpdate && Object.keys(editedData).length > 0) {
      try {
        await onUpdate(task.id, editedData);
        setIsEditing(false);
        setEditedData({});
      } catch (error) {
        console.error("Failed to update task:", error);
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({});
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
      case "low":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editedData.title ?? task.title}
                onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
                className="w-full text-2xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-b-2 border-blue-500 focus:outline-none"
                autoFocus
              />
            ) : (
              <h2
                id="task-detail-title"
                className="text-2xl font-bold text-gray-900 dark:text-gray-100"
              >
                {task.title}
              </h2>
            )}
          </div>
          <button
            onClick={handleClose}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                task.completed
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {task.completed ? "Completed" : "Pending"}
            </span>
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              <Edit2 className="w-4 h-4" />
              Description
            </label>
            {isEditing ? (
              <textarea
                value={editedData.description ?? task.description ?? ""}
                onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Add a description..."
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {task.description || "No description provided"}
              </p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              <AlertCircle className="w-4 h-4" />
              Priority
            </label>
            {isEditing ? (
              <select
                value={editedData.priority ?? task.priority}
                onChange={(e) =>
                  setEditedData({
                    ...editedData,
                    priority: e.target.value as TaskPriority,
                  })
                }
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            ) : (
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium capitalize ${getPriorityColor(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              <Calendar className="w-4 h-4" />
              Due Date
            </label>
            {isEditing ? (
              <input
                type="date"
                value={editedData.due_date ?? task.due_date ?? ""}
                onChange={(e) => setEditedData({ ...editedData, due_date: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300">
                {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"}
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              <Tag className="w-4 h-4" />
              Tags
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedData.tags?.join(", ") ?? task.tags?.join(", ") ?? ""}
                onChange={(e) =>
                  setEditedData({
                    ...editedData,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter tags separated by commas"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {task.tags && task.tags.length > 0 ? (
                  task.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">No tags</span>
                )}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Created: {formatDate(task.created_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Updated: {formatDate(task.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              {onUpdate && (
                <Button onClick={handleEdit}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Task
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskDetailModal;
