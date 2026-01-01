"use client";

/**
 * RecurringTaskForm Component
 *
 * Form component for creating and editing recurring tasks with RRULE patterns.
 * Features:
 * - Recurring pattern dropdown (DAILY, WEEKLY, MONTHLY, YEARLY)
 * - Optional end date picker for recurring tasks
 * - Display calculated next occurrence
 * - Seamless integration with TaskForm validation
 * - Real-time pattern validation
 *
 * Phase V - Task T062
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RECURRING_PATTERN_OPTIONS,
  RecurringPattern,
  getPatternDescription,
  getNextOccurrenceText,
  validatePattern,
  formatDateToUTC,
  parseUTCDate,
} from "@/lib/rrule";

export interface RecurringTaskFormData {
  recurringPattern: RecurringPattern | null;
  recurringEndDate: Date | null;
}

interface RecurringTaskFormProps {
  value: RecurringTaskFormData;
  onChange: (data: RecurringTaskFormData) => void;
  dueDate?: Date;
  nextOccurrence?: string | null;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export default function RecurringTaskForm({
  value,
  onChange,
  dueDate,
  nextOccurrence,
  error,
  disabled = false,
  className = "",
}: RecurringTaskFormProps) {
  const [isRecurring, setIsRecurring] = useState(!!value.recurringPattern);
  const [patternError, setPatternError] = useState<string>("");

  // Validate pattern on change
  useEffect(() => {
    if (value.recurringPattern && !validatePattern(value.recurringPattern)) {
      setPatternError("Invalid recurring pattern");
    } else {
      setPatternError("");
    }
  }, [value.recurringPattern]);

  const handleRecurringToggle = (checked: boolean) => {
    setIsRecurring(checked);
    if (!checked) {
      onChange({
        recurringPattern: null,
        recurringEndDate: null,
      });
    } else {
      onChange({
        recurringPattern: "DAILY",
        recurringEndDate: null,
      });
    }
  };

  const handlePatternChange = (pattern: RecurringPattern) => {
    onChange({
      ...value,
      recurringPattern: pattern,
    });
  };

  const handleEndDateChange = (dateString: string) => {
    if (!dateString) {
      onChange({
        ...value,
        recurringEndDate: null,
      });
      return;
    }

    const date = new Date(dateString);
    onChange({
      ...value,
      recurringEndDate: date,
    });
  };

  const handleClearEndDate = () => {
    onChange({
      ...value,
      recurringEndDate: null,
    });
  };

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return "";
    // Format as YYYY-MM-DD for input[type="date"]
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Recurring Task Toggle */}
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="recurring-toggle"
          checked={isRecurring}
          onChange={(e) => handleRecurringToggle(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <label
          htmlFor="recurring-toggle"
          className="text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          Make this a recurring task
        </label>
      </div>

      {/* Recurring Settings */}
      <AnimatePresence>
        {isRecurring && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 ps-7"
          >
            {/* Recurring Pattern Dropdown */}
            <div>
              <label
                htmlFor="recurring-pattern"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Repeat
              </label>
              <select
                id="recurring-pattern"
                value={value.recurringPattern || "DAILY"}
                onChange={(e) => handlePatternChange(e.target.value as RecurringPattern)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {RECURRING_PATTERN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.description})
                  </option>
                ))}
              </select>
              {patternError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {patternError}
                </p>
              )}
            </div>

            {/* Pattern Description */}
            {value.recurringPattern && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Pattern: <span className="font-medium">{getPatternDescription(value.recurringPattern)}</span>
              </div>
            )}

            {/* Recurring End Date */}
            <div>
              <label
                htmlFor="recurring-end-date"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                End Date (Optional)
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  id="recurring-end-date"
                  value={formatDateForInput(value.recurringEndDate)}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  disabled={disabled}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {value.recurringEndDate && (
                  <button
                    type="button"
                    onClick={handleClearEndDate}
                    disabled={disabled}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Leave blank for infinite recurrence
              </p>
            </div>

            {/* Next Occurrence Display */}
            {nextOccurrence && value.recurringPattern && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md"
              >
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {getNextOccurrenceText(nextOccurrence, value.recurringPattern)}
                </p>
              </motion.div>
            )}

            {/* Info Messages */}
            {!dueDate && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Set a due date to calculate the next occurrence
                </p>
              </div>
            )}

            {value.recurringEndDate && dueDate && value.recurringEndDate < dueDate && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-200">
                  End date cannot be before the due date
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form-level Error */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

/**
 * Example Usage:
 *
 * ```tsx
 * import RecurringTaskForm, { RecurringTaskFormData } from "@/components/RecurringTaskForm";
 *
 * const [recurringData, setRecurringData] = useState<RecurringTaskFormData>({
 *   recurringPattern: null,
 *   recurringEndDate: null,
 * });
 *
 * <RecurringTaskForm
 *   value={recurringData}
 *   onChange={setRecurringData}
 *   dueDate={dueDate}
 *   nextOccurrence={task?.next_occurrence}
 * />
 * ```
 */
