"use client";

/**
 * ReminderSettings Component - Phase V User Story 2
 *
 * Provides UI for setting due dates and reminder notifications for tasks.
 *
 * Features:
 * - Due date picker (date + time)
 * - Reminder offset selector (1 hour, 1 day, 1 week before due date)
 * - Validation: reminder requires due date
 * - Integration with task creation/update forms
 *
 * @component
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Bell, X } from 'lucide-react';

/**
 * Reminder offset options (hours before due date)
 */
const REMINDER_OFFSET_OPTIONS = [
  { value: 1, label: '1 hour before' },
  { value: 24, label: '1 day before' },
  { value: 168, label: '1 week before' },
] as const;

interface ReminderSettingsProps {
  /** Current due date value (ISO 8601 string or null) */
  dueDate: string | null;

  /** Current reminder offset value (hours, 1-168) */
  reminderOffsetHours: number | null;

  /** Callback when due date changes */
  onDueDateChange: (dueDate: string | null) => void;

  /** Callback when reminder offset changes */
  onReminderOffsetChange: (offsetHours: number | null) => void;

  /** Optional: Disable all inputs */
  disabled?: boolean;
}

/**
 * ReminderSettings Component
 *
 * Usage:
 * ```tsx
 * <ReminderSettings
 *   dueDate={task.due_date}
 *   reminderOffsetHours={task.reminder_offset_hours}
 *   onDueDateChange={(date) => setTaskData({ ...taskData, due_date: date })}
 *   onReminderOffsetChange={(offset) => setTaskData({ ...taskData, reminder_offset_hours: offset })}
 * />
 * ```
 */
export default function ReminderSettings({
  dueDate,
  reminderOffsetHours,
  onDueDateChange,
  onReminderOffsetChange,
  disabled = false,
}: ReminderSettingsProps) {
  // Local state for datetime input (HTML datetime-local requires 'YYYY-MM-DDTHH:MM' format)
  const [localDateTime, setLocalDateTime] = useState<string>('');

  // Convert ISO 8601 UTC string to local datetime-local format
  useEffect(() => {
    if (dueDate) {
      try {
        const date = new Date(dueDate);
        // Format: YYYY-MM-DDTHH:MM (datetime-local input format)
        const localDateTimeStr = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setLocalDateTime(localDateTimeStr);
      } catch (error) {
        console.error('Invalid due_date format:', dueDate);
        setLocalDateTime('');
      }
    } else {
      setLocalDateTime('');
    }
  }, [dueDate]);

  /**
   * Handle due date change from datetime-local input
   */
  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalDateTime(value);

    if (value) {
      // Convert local datetime to UTC ISO 8601 string
      const localDate = new Date(value);
      const utcIsoString = localDate.toISOString();
      onDueDateChange(utcIsoString);
    } else {
      // Clear due date (and reminder since it requires due date)
      onDueDateChange(null);
      onReminderOffsetChange(null);
    }
  };

  /**
   * Handle reminder offset change from select dropdown
   */
  const handleReminderOffsetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    if (value === '') {
      onReminderOffsetChange(null);
    } else {
      const offsetHours = parseInt(value, 10);
      if (!isNaN(offsetHours) && offsetHours >= 1 && offsetHours <= 168) {
        onReminderOffsetChange(offsetHours);
      }
    }
  };

  /**
   * Clear due date and reminder
   */
  const handleClearDueDate = () => {
    setLocalDateTime('');
    onDueDateChange(null);
    onReminderOffsetChange(null);
  };

  /**
   * Get minimum datetime for due date input (current time)
   */
  const getMinDateTime = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  /**
   * Calculate reminder time for display
   */
  const getReminderTimeDisplay = () => {
    if (!dueDate || !reminderOffsetHours) return null;

    try {
      const dueDateObj = new Date(dueDate);
      const reminderDate = new Date(dueDateObj.getTime() - reminderOffsetHours * 60 * 60 * 1000);

      return reminderDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return null;
    }
  };

  const reminderTimeDisplay = getReminderTimeDisplay();

  return (
    <div className="space-y-4">
      {/* Due Date Section */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Calendar className="w-4 h-4" />
          Due Date
        </label>

        <div className="flex gap-2">
          <input
            type="datetime-local"
            value={localDateTime}
            onChange={handleDueDateChange}
            min={getMinDateTime()}
            disabled={disabled}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {localDateTime && (
            <button
              type="button"
              onClick={handleClearDueDate}
              disabled={disabled}
              className="px-3 py-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400
                       border border-gray-300 dark:border-gray-600 rounded-lg
                       hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Clear due date"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Reminder Section (only shown if due date is set) */}
      {localDateTime && (
        <div className="space-y-2 ps-6 border-s-2 border-blue-200 dark:border-blue-800">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Bell className="w-4 h-4" />
            Reminder
          </label>

          <select
            value={reminderOffsetHours !== null ? reminderOffsetHours : ''}
            onChange={handleReminderOffsetChange}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">No reminder</option>
            {REMINDER_OFFSET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Reminder time preview */}
          {reminderTimeDisplay && (
            <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              Reminder at: <span className="font-medium">{reminderTimeDisplay}</span>
            </p>
          )}
        </div>
      )}

      {/* Validation message */}
      {!localDateTime && reminderOffsetHours !== null && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          ⚠️ Reminder requires a due date
        </p>
      )}
    </div>
  );
}
