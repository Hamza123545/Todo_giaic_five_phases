"use client";

/**
 * TaskForm Component
 *
 * Form for creating and editing tasks with validation
 * Supports title, description, priority, due date, and tags
 * Integrates with API client for task creation and updates
 */

import { useState, useEffect } from "react";
import { Task, TaskFormData, TaskPriority, ApiResponse } from "@/types";
import { cn, sanitizeInput } from "@/lib/utils";
import LoadingSpinner from "./LoadingSpinner";
import { api } from "@/lib/api";

interface TaskFormProps {
  userId: string;
  onSuccess?: (task: Task) => void;
  onError?: (error: Error) => void;
  initialData?: Task | null;
  submitLabel?: string;
  onCancel?: () => void;
  className?: string;
}

export default function TaskForm({
  userId,
  onSuccess,
  onError,
  initialData,
  submitLabel = "Create Task",
  onCancel,
  className,
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    tags: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || "",
        priority: initialData.priority,
        due_date: initialData.due_date || "",
        tags: initialData.tags || [],
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length > 200) {
      newErrors.title = "Title must be 200 characters or less";
    }

    // Description validation
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = "Description must be 1000 characters or less";
    }

    // Due date validation
    if (formData.due_date) {
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        newErrors.due_date = "Due date cannot be in the past";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Sanitize form data to prevent XSS
      const sanitizedFormData = {
        ...formData,
        title: sanitizeInput(formData.title),
        description: formData.description ? sanitizeInput(formData.description) : "",
      };

      let response;

      if (initialData) {
        // Update existing task
        response = await api.updateTask(userId, initialData.id, sanitizedFormData);
      } else {
        // Create new task
        response = await api.createTask(userId, sanitizedFormData);
      }

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to save task");
      }

      // Reset form after successful creation (not for updates)
      if (!initialData) {
        setFormData({
          title: "",
          description: "",
          priority: "medium",
          due_date: "",
          tags: [],
        });
        setTagInput("");
      }

      // Call success callback
      onSuccess?.(response.data);
    } catch (error: any) {
      console.error("Form submission error:", error);

      // Set error message
      setErrors({
        submit: error.message || "An error occurred while saving the task",
      });

      // Call error callback
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();

    if (!tag) {
      return;
    }

    if (formData.tags?.includes(tag)) {
      setTagInput("");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      tags: [...(prev.tags || []), tag],
    }));
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-4", className)}
      aria-label={initialData ? "Edit task form" : "Create task form"}
    >
      {/* Title Field */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Title <span className="text-red-500" aria-label="required">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={cn(
            "w-full px-3 py-2 border rounded-md shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
            errors.title && "border-red-500 focus:ring-red-500"
          )}
          placeholder="Enter task title"
          maxLength={200}
          required
          aria-required="true"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
          disabled={isLoading}
        />
        {errors.title && (
          <p id="title-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.title}
          </p>
        )}
      </div>

      {/* Description Field */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className={cn(
            "w-full px-3 py-2 border rounded-md shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
            errors.description && "border-red-500 focus:ring-red-500"
          )}
          placeholder="Enter task description (optional)"
          maxLength={1000}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "description-error" : undefined}
          disabled={isLoading}
        />
        {errors.description && (
          <p id="description-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.description}
          </p>
        )}
      </div>

      {/* Priority and Due Date Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Priority Field */}
        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className={cn(
              "w-full px-3 py-2 border rounded-md shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              "dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            )}
            disabled={isLoading}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Due Date Field */}
        <div>
          <label
            htmlFor="due_date"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Due Date
          </label>
          <input
            type="date"
            id="due_date"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            className={cn(
              "w-full px-3 py-2 border rounded-md shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
              errors.due_date && "border-red-500 focus:ring-red-500"
            )}
            aria-invalid={!!errors.due_date}
            aria-describedby={errors.due_date ? "due-date-error" : undefined}
            disabled={isLoading}
          />
          {errors.due_date && (
            <p id="due-date-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.due_date}
            </p>
          )}
        </div>
      </div>

      {/* Tags Field */}
      <div>
        <label
          htmlFor="tag-input"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Tags
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="tag-input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            className={cn(
              "flex-1 px-3 py-2 border rounded-md shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              "dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            )}
            placeholder="Add tag and press Enter"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handleAddTag}
            className={cn(
              "px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md",
              "dark:bg-gray-700 dark:hover:bg-gray-600",
              "transition-colors"
            )}
            disabled={isLoading}
            aria-label="Add tag"
          >
            Add
          </button>
        </div>

        {/* Display Tags */}
        {formData.tags && formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2" role="list" aria-label="Tags">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                role="listitem"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                  aria-label={`Remove tag ${tag}`}
                  disabled={isLoading}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Form Error Message */}
      {errors.submit && (
        <div
          className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
          role="alert"
        >
          <p className="text-sm text-red-800 dark:text-red-200">{errors.submit}</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors flex items-center justify-center gap-2"
          )}
          aria-label={submitLabel}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="small" color="white" />
              <span>Saving...</span>
            </>
          ) : (
            submitLabel
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md",
              "dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300",
              "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
            aria-label="Cancel"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
