/**
 * Logging and error tracking utilities
 *
 * Provides structured logging and error tracking capabilities
 * with support for different log levels and error reporting services
 */

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, unknown>;
  error?: Error;
  userId?: string;
  sessionId?: string;
}

export interface ErrorReport {
  error: Error;
  errorInfo?: unknown;
  context?: Record<string, unknown>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeGlobalErrorHandlers();
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Initialize global error handlers
  private initializeGlobalErrorHandlers(): void {
    if (typeof window === "undefined") return;

    // Catch unhandled errors
    window.addEventListener("error", (event) => {
      this.error("Unhandled error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.error("Unhandled promise rejection", {
        reason: event.reason,
      });
    });
  }

  // Set current user ID for tracking
  setUserId(userId: string): void {
    this.userId = userId;
  }

  // Clear user ID (on logout)
  clearUserId(): void {
    this.userId = undefined;
  }

  // Create log entry
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: Date.now(),
      context,
      error,
      userId: this.userId,
      sessionId: this.sessionId,
    };
  }

  // Add log to memory
  private addLog(entry: LogEntry): void {
    this.logs.push(entry);

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output based on environment
    if (process.env.NODE_ENV === "development") {
      this.consoleOutput(entry);
    }
  }

  // Console output with formatting
  private consoleOutput(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.context);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.context);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.context);
        break;
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.context, entry.error);
        break;
    }
  }

  // Debug log
  debug(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.addLog(entry);
  }

  // Info log
  info(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.addLog(entry);
  }

  // Warning log
  warn(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.addLog(entry);
  }

  // Error log
  error(message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.addLog(entry);

    // Send to error tracking service
    this.reportError({
      error: error || new Error(message),
      context,
      timestamp: entry.timestamp,
      userId: this.userId,
      sessionId: this.sessionId,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
    });
  }

  // Report error to tracking service
  private reportError(report: ErrorReport): void {
    // TODO: Integrate with error tracking service
    // Examples: Sentry, Bugsnag, LogRocket, etc.
    //
    // Sentry.captureException(report.error, {
    //   contexts: {
    //     custom: report.context,
    //   },
    //   user: {
    //     id: report.userId,
    //   },
    //   tags: {
    //     sessionId: report.sessionId,
    //   },
    // });

    // For now, just log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error Report:", report);
    }
  }

  // Track user action for analytics
  trackAction(action: string, category?: string, label?: string, value?: number): void {
    this.info("User action", {
      action,
      category,
      label,
      value,
    });

    // TODO: Send to analytics service
    // Examples: Google Analytics, Mixpanel, Amplitude, etc.
    //
    // interface WindowWithGtag extends Window {
    //   gtag?: (command: string, action: string, params?: Record<string, unknown>) => void;
    // }
    // const windowWithGtag = window as unknown as WindowWithGtag;
    // if (typeof window !== "undefined" && windowWithGtag.gtag) {
    //   windowWithGtag.gtag("event", action, {
    //     event_category: category,
    //     event_label: label,
    //     value: value,
    //   });
    // }
  }

  // Track page view
  trackPageView(path: string, title?: string): void {
    this.info("Page view", { path, title });

    // TODO: Send to analytics service
    // interface WindowWithGtag extends Window {
    //   gtag?: (command: string, action: string, params?: Record<string, unknown>) => void;
    // }
    // const windowWithGtag = window as unknown as WindowWithGtag;
    // if (typeof window !== "undefined" && windowWithGtag.gtag) {
    //   windowWithGtag.gtag("event", "page_view", {
    //     page_path: path,
    //     page_title: title,
    //   });
    // }
  }

  // Get all logs
  getLogs(level?: LogLevel): LogEntry[] {
    if (!level) return [...this.logs];
    return this.logs.filter((log) => log.level === level);
  }

  // Get recent logs
  getRecentLogs(count: number = 10): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Clear all logs
  clearLogs(): void {
    this.logs = [];
  }

  // Export logs (for debugging)
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Download logs as file
  downloadLogs(): void {
    if (typeof window === "undefined") return;

    const dataStr = this.exportLogs();
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `logs-${this.sessionId}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience functions
export const logDebug = (message: string, context?: Record<string, unknown>) =>
  logger.debug(message, context);

export const logInfo = (message: string, context?: Record<string, unknown>) =>
  logger.info(message, context);

export const logWarn = (message: string, context?: Record<string, unknown>) =>
  logger.warn(message, context);

export const logError = (message: string, context?: Record<string, unknown>, error?: Error) =>
  logger.error(message, context, error);

export const trackAction = (action: string, category?: string, label?: string, value?: number) =>
  logger.trackAction(action, category, label, value);

export const trackPageView = (path: string, title?: string) => logger.trackPageView(path, title);
