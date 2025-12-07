/**
 * Type Definitions for Todo Application
 *
 * Centralized TypeScript type definitions for the frontend application
 * Ensures type safety and consistency across components
 */

// User-related types
export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserSignupData {
  name: string;
  email: string;
  password: string;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expires_at: string;
}

// Task-related types
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TaskPriority;
  due_date?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  priority: TaskPriority;
  due_date?: string;
  tags?: string[];
}

// API response types
export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Task query parameters
export interface TaskQueryParams {
  status?: "all" | "pending" | "completed";
  sort?: SortParam;
  search?: string;
  page?: number;
  limit?: number;
}

export type SortField = "created" | "updated" | "due_date" | "title" | "priority";
export type SortParam = `${SortField}:${"asc" | "desc"}`;

// Loading state
export type LoadingState = "idle" | "loading" | "success" | "error";

// Export format types
export type ExportFormat = "json" | "csv" | "xml";

// Import result
export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// Task filter type
export type TaskFilter = "all" | "pending" | "completed";

// View mode types
export type TaskViewMode = "list" | "grid" | "kanban" | "card";

// Sort direction
export type SortDirection = "asc" | "desc";

// Sort config
export interface SortConfig {
  key: SortField;
  direction: SortDirection;
}

// Toast notification types
export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}