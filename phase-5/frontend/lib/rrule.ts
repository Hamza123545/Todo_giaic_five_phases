/**
 * RRULE Utility Helpers for Frontend
 *
 * Provides utilities for working with recurring tasks:
 * - Human-readable pattern descriptions
 * - Date formatting for ISO 8601 UTC
 * - Pattern validation
 * - Next occurrence display
 *
 * Phase V - Task T063
 */

/**
 * Supported recurring patterns
 */
export type RecurringPattern = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | string;

/**
 * Recurring pattern option for dropdowns
 */
export interface RecurringPatternOption {
  value: RecurringPattern;
  label: string;
  description: string;
}

/**
 * Available recurring pattern options
 */
export const RECURRING_PATTERN_OPTIONS: RecurringPatternOption[] = [
  {
    value: "DAILY",
    label: "Daily",
    description: "Every day",
  },
  {
    value: "WEEKLY",
    label: "Weekly",
    description: "Every week",
  },
  {
    value: "MONTHLY",
    label: "Monthly",
    description: "Every month",
  },
  {
    value: "YEARLY",
    label: "Yearly",
    description: "Every year",
  },
];

/**
 * Get human-readable description for recurring pattern
 *
 * @param pattern - RRULE pattern string
 * @returns Human-readable description
 *
 * @example
 * getPatternDescription("DAILY") // "Every day"
 * getPatternDescription("WEEKLY") // "Every week"
 * getPatternDescription("FREQ=WEEKLY;INTERVAL=2") // "Every 2 weeks"
 */
export function getPatternDescription(pattern: string | null | undefined): string {
  if (!pattern) {
    return "Does not repeat";
  }

  const patternUpper = pattern.toUpperCase();

  // Simple patterns
  const simplePattern = RECURRING_PATTERN_OPTIONS.find(
    (opt) => opt.value === patternUpper
  );
  if (simplePattern) {
    return simplePattern.description;
  }

  // Full RRULE patterns
  if (patternUpper.startsWith("FREQ=")) {
    const freqMatch = patternUpper.match(/FREQ=(\w+)/);
    const intervalMatch = patternUpper.match(/INTERVAL=(\d+)/);
    const bydayMatch = patternUpper.match(/BYDAY=([A-Z,]+)/);

    if (!freqMatch) {
      return pattern; // Fallback to raw pattern
    }

    const freq = freqMatch[1];
    const interval = intervalMatch ? parseInt(intervalMatch[1]) : 1;

    let description = "";

    if (interval === 1) {
      description = "Every ";
    } else {
      description = `Every ${interval} `;
    }

    switch (freq) {
      case "DAILY":
        description += interval === 1 ? "day" : "days";
        break;
      case "WEEKLY":
        description += interval === 1 ? "week" : "weeks";
        if (bydayMatch) {
          const days = bydayMatch[1]
            .split(",")
            .map(formatWeekday)
            .join(", ");
          description += ` on ${days}`;
        }
        break;
      case "MONTHLY":
        description += interval === 1 ? "month" : "months";
        break;
      case "YEARLY":
        description += interval === 1 ? "year" : "years";
        break;
      default:
        return pattern; // Unsupported frequency
    }

    return description;
  }

  // Unknown pattern format
  return pattern;
}

/**
 * Format weekday abbreviation to full name
 *
 * @param day - Weekday abbreviation (MO, TU, WE, TH, FR, SA, SU)
 * @returns Full weekday name
 */
function formatWeekday(day: string): string {
  const weekdays: Record<string, string> = {
    MO: "Monday",
    TU: "Tuesday",
    WE: "Wednesday",
    TH: "Thursday",
    FR: "Friday",
    SA: "Saturday",
    SU: "Sunday",
  };
  return weekdays[day.toUpperCase()] || day;
}

/**
 * Format date to ISO 8601 UTC format for API
 *
 * @param date - Date object
 * @returns ISO 8601 UTC string (e.g., "2025-12-30T10:00:00Z")
 *
 * @example
 * formatDateToUTC(new Date("2025-12-30T10:00:00")) // "2025-12-30T10:00:00Z"
 */
export function formatDateToUTC(date: Date): string {
  return date.toISOString();
}

/**
 * Parse ISO 8601 UTC string to Date
 *
 * @param dateString - ISO 8601 UTC string
 * @returns Date object or null if invalid
 *
 * @example
 * parseUTCDate("2025-12-30T10:00:00Z") // Date object
 */
export function parseUTCDate(dateString: string | null | undefined): Date | null {
  if (!dateString) {
    return null;
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
}

/**
 * Format date for display (local timezone)
 *
 * @param dateString - ISO 8601 UTC string
 * @returns Formatted date string for display
 *
 * @example
 * formatDateForDisplay("2025-12-30T10:00:00Z") // "Dec 30, 2025 at 10:00 AM"
 */
export function formatDateForDisplay(dateString: string | null | undefined): string {
  const date = parseUTCDate(dateString);
  if (!date) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Validate RRULE pattern (basic validation)
 *
 * @param pattern - RRULE pattern string
 * @returns true if pattern is valid, false otherwise
 *
 * @example
 * validatePattern("DAILY") // true
 * validatePattern("FREQ=WEEKLY;INTERVAL=2") // true
 * validatePattern("INVALID") // false
 */
export function validatePattern(pattern: string | null | undefined): boolean {
  if (!pattern) {
    return false;
  }

  const patternUpper = pattern.toUpperCase();

  // Check simple patterns
  const isSimple = RECURRING_PATTERN_OPTIONS.some(
    (opt) => opt.value === patternUpper
  );
  if (isSimple) {
    return true;
  }

  // Check full RRULE format (basic validation)
  if (patternUpper.startsWith("FREQ=")) {
    const validFreqs = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
    const freqMatch = patternUpper.match(/FREQ=(\w+)/);
    if (!freqMatch) {
      return false;
    }

    const freq = freqMatch[1];
    return validFreqs.includes(freq);
  }

  // Unknown format
  return false;
}

/**
 * Get next occurrence display text
 *
 * @param nextOccurrence - Next occurrence ISO string
 * @param recurringPattern - Recurring pattern
 * @returns Display text for next occurrence
 *
 * @example
 * getNextOccurrenceText("2025-12-31T10:00:00Z", "DAILY")
 * // "Next occurrence: Dec 31, 2025 at 10:00 AM (Daily)"
 */
export function getNextOccurrenceText(
  nextOccurrence: string | null | undefined,
  recurringPattern: string | null | undefined
): string {
  if (!nextOccurrence || !recurringPattern) {
    return "No next occurrence";
  }

  const formattedDate = formatDateForDisplay(nextOccurrence);
  const patternDesc = getPatternDescription(recurringPattern);

  return `Next occurrence: ${formattedDate} (${patternDesc})`;
}

/**
 * Check if task is recurring
 *
 * @param recurringPattern - Recurring pattern string
 * @returns true if task is recurring, false otherwise
 */
export function isRecurring(recurringPattern: string | null | undefined): boolean {
  return !!recurringPattern && validatePattern(recurringPattern);
}

/**
 * Get badge variant for recurring tasks
 *
 * @param recurringPattern - Recurring pattern string
 * @returns Badge variant ("default" | "secondary" | "outline")
 */
export function getRecurringBadgeVariant(
  recurringPattern: string | null | undefined
): "default" | "secondary" | "outline" {
  if (!recurringPattern) {
    return "outline";
  }

  const patternUpper = recurringPattern.toUpperCase();

  if (patternUpper === "DAILY") {
    return "default";
  } else if (patternUpper === "WEEKLY") {
    return "secondary";
  } else {
    return "outline";
  }
}

/**
 * Format recurring pattern for API request
 *
 * @param pattern - User-selected pattern
 * @returns Formatted pattern for API
 */
export function formatPatternForAPI(pattern: RecurringPattern | null): string | null {
  if (!pattern) {
    return null;
  }

  // Return as-is (backend handles validation)
  return pattern;
}

/**
 * Create recurring task payload for API
 *
 * @param title - Task title
 * @param dueDate - Due date (Date object)
 * @param recurringPattern - Recurring pattern
 * @param recurringEndDate - End date (Date object, optional)
 * @returns API payload object
 */
export interface RecurringTaskPayload {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  due_date?: string;
  recurring_pattern?: string;
  recurring_end_date?: string | null;
  tags?: string[];
}

export function createRecurringTaskPayload(
  title: string,
  options: {
    description?: string;
    priority?: "low" | "medium" | "high";
    dueDate?: Date;
    recurringPattern?: RecurringPattern | null;
    recurringEndDate?: Date | null;
    tags?: string[];
  } = {}
): RecurringTaskPayload {
  const payload: RecurringTaskPayload = {
    title,
  };

  if (options.description) {
    payload.description = options.description;
  }

  if (options.priority) {
    payload.priority = options.priority;
  }

  if (options.dueDate) {
    payload.due_date = formatDateToUTC(options.dueDate);
  }

  if (options.recurringPattern) {
    payload.recurring_pattern = formatPatternForAPI(options.recurringPattern);
  }

  if (options.recurringEndDate) {
    payload.recurring_end_date = formatDateToUTC(options.recurringEndDate);
  } else if (options.recurringPattern) {
    // Explicitly set to null for infinite recurrence
    payload.recurring_end_date = null;
  }

  if (options.tags && options.tags.length > 0) {
    payload.tags = options.tags;
  }

  return payload;
}
