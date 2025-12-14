/**
 * Frontend TypeScript Type Definitions
 *
 * Defines all types for User, Task, API responses, and authentication
 * Used across the frontend application for type safety
 */

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserSignupData extends UserCredentials {
  name: string;
}

// Task Types
export type TaskStatus = "pending" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type TaskFilter = "all" | "pending" | "completed";

export interface Task {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TaskPriority;
  due_date?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// TaskUI - UI representation of Task (for offline storage)
export type TaskUI = Task;

export interface TaskFormData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
  tags?: string[];
}

export type SortField = "created" | "title" | "updated" | "priority" | "due_date";
export type SortParam = SortField | `${SortField}:${"asc" | "desc"}`;
export type SortDirection = "asc" | "desc";

export interface SortConfig {
  key: SortField;
  direction: SortDirection;
}

export interface TaskQueryParams {
  status?: "all" | "pending" | "completed";
  sort?: SortParam;
  search?: string;
  page?: number;
  limit?: number;
  priority?: TaskPriority;
  due_date?: string;
  tags?: string[];
}

export type TaskViewMode = "list" | "grid" | "kanban";

// API Response Types
export interface ApiResponse<T = unknown> {
  data?: T;
  success: boolean;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Authentication Types
export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface Session {
  user: User;
  token: string;
  expiresAt: number;
}

// Error Types
export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  field?: string;
}

// Form Types
export interface FormErrors {
  [key: string]: string | undefined;
}

// Loading States
export type LoadingState = "idle" | "loading" | "success" | "error";

// Toast Notification Types
export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// Export/Import Types
export type ExportFormat = "csv" | "json" | "pdf";

export interface ImportResult {
  imported: number;
  errors: number;
  errorDetails?: string[];
}
