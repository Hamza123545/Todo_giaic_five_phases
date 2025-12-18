"use client";

/**
 * TaskForm Component
 *
 * Form for creating and editing tasks with comprehensive Zod validation
 * Supports title, description, priority, due date, and tags
 * Features:
 * - Field-level validation on blur
 * - Form-level validation on submit
 * - Character count for title (200) and description (1000)
 * - Real-time error display with accessibility
 * - Enhanced UX with Framer Motion animations
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task, TaskFormData } from "@/types";
import { cn, sanitizeInput } from "@/lib/utils";
import {
  taskFormSchema,
  formatCharCount,
  isOverLimit,
  safeParse,
} from "@/lib/validations";
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
  const validationTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

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
    // Use Zod schema for comprehensive validation
    const result = safeParse(taskFormSchema, formData);

    if (!result.success && result.errors) {
      setErrors(result.errors);

      // Focus first invalid field for accessibility
      const firstErrorField = Object.keys(result.errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        element?.focus();
      }

      return false;
    }

    setErrors({});
    return true;
  };

  /**
   * Validate a single field on blur
   * Provides immediate feedback as user completes each field
   */
  const validateField = (fieldName: keyof TaskFormData) => {
    const value = formData[fieldName];

    // Create a partial schema for the specific field
    try {
      if (fieldName === "title") {
        taskFormSchema.shape.title.parse(value);
      } else if (fieldName === "description") {
        taskFormSchema.shape.description.parse(value);
      } else if (fieldName === "priority") {
        taskFormSchema.shape.priority.parse(value);
      } else if (fieldName === "due_date") {
        taskFormSchema.shape.due_date.parse(value);
      } else if (fieldName === "tags") {
        taskFormSchema.shape.tags.parse(value);
      }

      // Clear error if validation passes
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    } catch (error: unknown) {
      // Set error if validation fails - extract just the message
      let errorMessage = "Invalid value";
      
      // Check if it's a ZodError
      if (error && typeof error === "object" && "issues" in error && Array.isArray((error as { issues: unknown[] }).issues)) {
        // Zod error - extract first issue message
        const zodError = error as { issues: Array<{ message?: string }> };
        errorMessage = zodError.issues[0]?.message || "Invalid value";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === "object") {
        // Handle serialized Zod error format
        if ("errors" in error && Array.isArray((error as { errors: unknown[] }).errors)) {
          const zodError = error as { errors: Array<{ message?: string }> };
          errorMessage = zodError.errors[0]?.message || "Invalid value";
        }
      }
      
      setErrors((prev) => ({ ...prev, [fieldName]: errorMessage }));
    }
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
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      console.error("Form submission error:", errorObj);

      // Set error message
      setErrors({
        submit: errorObj.message || "An error occurred while saving the task",
      });

      // Call error callback
      onError?.(errorObj);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error immediately when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Clear previous timeout for this field
    if (validationTimeoutsRef.current[name]) {
      clearTimeout(validationTimeoutsRef.current[name]);
    }

    // Real-time validation: validate field after a short delay (debounced)
    // This provides immediate feedback without being too aggressive
    validationTimeoutsRef.current[name] = setTimeout(() => {
      validateField(name as keyof TaskFormData);
      delete validationTimeoutsRef.current[name];
    }, 500); // 500ms debounce
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = validationTimeoutsRef.current;
    return () => {
      Object.values(timeouts).forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  const handleAddTag = () => {
    // Backend behavior: strips but doesn't lowercase
    // Match backend exactly: cleaned_tags = [tag.strip() for tag in v if tag and tag.strip()]
    const tag = tagInput.trim();

    if (!tag) {
      return;
    }

    // Check if tag already exists (case-sensitive to match backend)
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
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Title{" "}
            <span className="text-red-500" aria-label="required">
              *
            </span>
          </label>
          <span
            className={cn(
              "text-xs",
              isOverLimit(formData.title, 200)
                ? "text-red-600 dark:text-red-400 font-medium"
                : "text-gray-500 dark:text-gray-400"
            )}
            aria-live="polite"
          >
            {formatCharCount(formData.title, 200)}
          </span>
        </div>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          onBlur={() => validateField("title")}
          className={cn(
            "w-full px-3 py-2 border rounded-md shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
            errors.title && "border-red-500 focus:ring-red-500"
          )}
          placeholder="Enter task title"
          required
          aria-required="true"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
          disabled={isLoading}
        />
        <AnimatePresence>
          {errors.title && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              id="title-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
              role="alert"
            >
              <span className="inline-block">⚠</span>
              {errors.title}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Description Field */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Description
          </label>
          <span
            className={cn(
              "text-xs",
              isOverLimit(formData.description || "", 1000)
                ? "text-red-600 dark:text-red-400 font-medium"
                : "text-gray-500 dark:text-gray-400"
            )}
            aria-live="polite"
          >
            {formatCharCount(formData.description || "", 1000)}
          </span>
        </div>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          onBlur={() => validateField("description")}
          rows={3}
          className={cn(
            "w-full px-3 py-2 border rounded-md shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
            errors.description && "border-red-500 focus:ring-red-500"
          )}
          placeholder="Enter task description (optional)"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "description-error" : undefined}
          disabled={isLoading}
        />
        <AnimatePresence>
          {errors.description && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              id="description-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
              role="alert"
            >
              <span className="inline-block">⚠</span>
              {errors.description}
            </motion.p>
          )}
        </AnimatePresence>
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
            onBlur={() => validateField("due_date")}
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
          <AnimatePresence>
            {errors.due_date && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                id="due-date-error"
                className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                role="alert"
              >
                <span className="inline-block">⚠</span>
                {errors.due_date}
              </motion.p>
            )}
          </AnimatePresence>
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
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: isLoading ? 1 : 1.02 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
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
        </motion.button>

        {onCancel && (
          <motion.button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
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
          </motion.button>
        )}
      </div>
    </form>
  );
}
