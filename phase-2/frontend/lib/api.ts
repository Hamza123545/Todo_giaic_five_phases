/**
 * Centralized API Client Library
 *
 * All backend API calls MUST go through this client.
 * Automatically attaches JWT token from Better Auth session.
 * Handles 401 errors and redirects to login.
 * Provides typed TypeScript interfaces for all API calls.
 * Includes error handling and retry logic.
 */

import {
  Task,
  TaskFormData,
  TaskQueryParams,
  TaskPriority,
  ApiResponse,
  PaginatedResponse,
  UserSignupData,
  UserCredentials,
  AuthResponse,
  ImportResult,
  ExportFormat,
} from "@/types";
import { getToken } from "@/lib/auth";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

/**
 * Delay utility for retry logic
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Handle API errors and redirect to login if unauthorized
 */
const handleApiError = (error: unknown, statusCode?: number): never => {
  // Redirect to login on 401 Unauthorized
  if (statusCode === 401) {
    if (typeof window !== "undefined") {
      // Only redirect if not already on auth pages
      const currentPath = window.location.pathname;
      if (currentPath !== "/signin" && currentPath !== "/signup") {
        // Clear user data if stored
        sessionStorage.removeItem("user");
        window.location.href = "/signin";
      }
    }
  }

  const errorMessage = error instanceof Error ? error.message : "An error occurred";
  const errorCode = (error as { code?: string })?.code || "UNKNOWN_ERROR";

  throw {
    message: errorMessage,
    code: errorCode,
    statusCode: statusCode || 500,
  };
};

/**
 * Generic fetch wrapper with retry logic and error handling
 *
 * @param endpoint - API endpoint (without base URL)
 * @param options - Fetch options
 * @param token - JWT token (required for authenticated requests)
 * @param retries - Number of retries for network errors
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  token: string | null = null,
  retries = MAX_RETRIES
): Promise<ApiResponse<T>> {
  // Get token if not provided
  let authToken = token;
  if (!authToken) {
    try {
      const { data: tokenData } = await getToken();
      authToken = tokenData?.token || null;
    } catch (error) {
      console.debug("Failed to get token:", error);
      authToken = null;
    }
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Attach JWT token if available
  if (authToken) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${authToken}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      if (!response.ok) {
        handleApiError({ message: `HTTP error ${response.status}` }, response.status);
      }
      return { success: true, data: {} as T };
    }

    const data = await response.json();

    // Handle errors
    if (!response.ok) {
      // Don't redirect on 401 if we're already being redirected
      // This prevents redirect loops
      if (response.status === 401 && typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (currentPath === "/signin" || currentPath === "/signup") {
          // Already on auth page, don't redirect
          return data;
        }
      }
      handleApiError(data.error || data, response.status);
    }

    return data;
  } catch (error: unknown) {
    // Retry on network errors
    if (retries > 0 && error instanceof Error && error.name === "TypeError") {
      await delay(RETRY_DELAY);
      return apiFetch<T>(endpoint, options, authToken, retries - 1);
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * API Client Class
 */
export class ApiClient {
  // ==================== Authentication Methods ====================

  async signup(userData: UserSignupData): Promise<ApiResponse<AuthResponse>> {
    // Signup doesn't require token
    return apiFetch<AuthResponse>(
      "/api/auth/signup",
      {
        method: "POST",
        body: JSON.stringify(userData),
      },
      null
    );
  }

  async signin(credentials: UserCredentials): Promise<ApiResponse<AuthResponse>> {
    // Signin doesn't require token
    return apiFetch<AuthResponse>(
      "/api/auth/signin",
      {
        method: "POST",
        body: JSON.stringify(credentials),
      },
      null
    );
  }

  async signout(): Promise<ApiResponse<void>> {
    const { data: tokenData } = await getToken();
    return apiFetch<void>("/api/auth/signout", { method: "POST" }, tokenData?.token || null);
  }

  // ==================== Task Management Methods ====================

  async getTasks(
    userId: string,
    queryParams?: TaskQueryParams
  ): Promise<ApiResponse<PaginatedResponse<Task>>> {
    // Get token first (same pattern as phase-2-web)
    const { data: tokenData, error: tokenError } = await getToken();
    if (tokenError || !tokenData?.token) {
      return {
        success: false,
        message: "Authentication required",
        error: { code: "UNAUTHORIZED", message: "Please sign in to continue" },
      };
    }

    const params = new URLSearchParams();

    if (queryParams?.status) params.append("status", queryParams.status);
    if (queryParams?.sort) params.append("sort", queryParams.sort);
    if (queryParams?.search) params.append("search", queryParams.search);
    if (queryParams?.page) params.append("page", queryParams.page.toString());
    if (queryParams?.limit) params.append("limit", queryParams.limit.toString());

    const queryString = params.toString();
    const endpoint = `/api/${userId}/tasks${queryString ? `?${queryString}` : ""}`;

    return apiFetch<PaginatedResponse<Task>>(endpoint, {}, tokenData.token);
  }

  async createTask(userId: string, taskData: TaskFormData): Promise<ApiResponse<Task>> {
    // Get token first
    const { data: tokenData, error: tokenError } = await getToken();
    if (tokenError || !tokenData?.token) {
      return {
        success: false,
        message: "Authentication required",
        error: { code: "UNAUTHORIZED", message: "Please sign in to continue" },
      };
    }

    return apiFetch<Task>(
      `/api/${userId}/tasks`,
      {
        method: "POST",
        body: JSON.stringify(taskData),
      },
      tokenData.token
    );
  }

  async getTaskById(userId: string, taskId: number): Promise<ApiResponse<Task>> {
    const { data: tokenData, error: tokenError } = await getToken();
    if (tokenError || !tokenData?.token) {
      return {
        success: false,
        message: "Authentication required",
        error: { code: "UNAUTHORIZED", message: "Please sign in to continue" },
      };
    }
    return apiFetch<Task>(`/api/${userId}/tasks/${taskId}`, {}, tokenData.token);
  }

  async updateTask(
    userId: string,
    taskId: number,
    taskData: Partial<TaskFormData>
  ): Promise<ApiResponse<Task>> {
    const { data: tokenData, error: tokenError } = await getToken();
    if (tokenError || !tokenData?.token) {
      return {
        success: false,
        message: "Authentication required",
        error: { code: "UNAUTHORIZED", message: "Please sign in to continue" },
      };
    }
    return apiFetch<Task>(
      `/api/${userId}/tasks/${taskId}`,
      {
        method: "PUT",
        body: JSON.stringify(taskData),
      },
      tokenData.token
    );
  }

  async deleteTask(userId: string, taskId: number): Promise<ApiResponse<void>> {
    const { data: tokenData, error: tokenError } = await getToken();
    if (tokenError || !tokenData?.token) {
      return {
        success: false,
        message: "Authentication required",
        error: { code: "UNAUTHORIZED", message: "Please sign in to continue" },
      };
    }
    return apiFetch<void>(`/api/${userId}/tasks/${taskId}`, { method: "DELETE" }, tokenData.token);
  }

  async toggleTaskComplete(
    userId: string,
    taskId: number,
    completed: boolean
  ): Promise<ApiResponse<Task>> {
    const { data: tokenData, error: tokenError } = await getToken();
    if (tokenError || !tokenData?.token) {
      return {
        success: false,
        message: "Authentication required",
        error: { code: "UNAUTHORIZED", message: "Please sign in to continue" },
      };
    }
    return apiFetch<Task>(
      `/api/${userId}/tasks/${taskId}/complete`,
      {
        method: "PATCH",
        body: JSON.stringify({ completed }),
      },
      tokenData.token
    );
  }

  async reorderTasks(
    userId: string,
    taskIds: number[]
  ): Promise<ApiResponse<{ reordered: number }>> {
    const { data: tokenData, error: tokenError } = await getToken();
    if (tokenError || !tokenData?.token) {
      return {
        success: false,
        message: "Authentication required",
        error: { code: "UNAUTHORIZED", message: "Please sign in to continue" },
      };
    }
    return apiFetch<{ reordered: number }>(
      `/api/${userId}/tasks/reorder`,
      {
        method: "POST",
        body: JSON.stringify(taskIds),
      },
      tokenData.token
    );
  }

  // ==================== Export/Import Methods ====================

  async exportTasks(userId: string, format: ExportFormat): Promise<Blob> {
    const { data: tokenData, error: tokenError } = await getToken();
    if (tokenError || !tokenData?.token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${API_BASE_URL}/api/${userId}/tasks/export?format=${format}`, {
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Export failed");
    }

    return response.blob();
  }

  async importTasks(userId: string, file: File): Promise<ApiResponse<ImportResult>> {
    const { data: tokenData, error: tokenError } = await getToken();
    if (tokenError || !tokenData?.token) {
      return {
        success: false,
        message: "Authentication required",
        error: { code: "UNAUTHORIZED", message: "Please sign in to continue" },
      };
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/${userId}/tasks/import`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
      },
      body: formData,
    });

    return response.json();
  }

  // ==================== Bulk Operations Methods ====================

  async bulkDeleteTasks(
    userId: string,
    taskIds: number[]
  ): Promise<ApiResponse<{ deleted: number }>> {
    const { data: tokenData, error: tokenError } = await getToken();
    if (tokenError || !tokenData?.token) {
      return {
        success: false,
        message: "Authentication required",
        error: { code: "UNAUTHORIZED", message: "Please sign in to continue" },
      };
    }
    return apiFetch<{ deleted: number }>(
      `/api/${userId}/tasks/bulk`,
      {
        method: "POST",
        body: JSON.stringify({
          action: "delete",
          task_ids: taskIds,
        }),
      },
      tokenData.token
    );
  }

  async bulkUpdateTaskStatus(
    userId: string,
    taskIds: number[],
    completed: boolean
  ): Promise<ApiResponse<{ updated: number }>> {
    const { data: tokenData, error: tokenError } = await getToken();
    if (tokenError || !tokenData?.token) {
      return {
        success: false,
        message: "Authentication required",
        error: { code: "UNAUTHORIZED", message: "Please sign in to continue" },
      };
    }
    return apiFetch<{ updated: number }>(
      `/api/${userId}/tasks/bulk`,
      {
        method: "POST",
        body: JSON.stringify({
          action: "update_status",
          task_ids: taskIds,
          completed,
        }),
      },
      tokenData.token
    );
  }

  async bulkUpdateTaskPriority(
    userId: string,
    taskIds: number[],
    priority: TaskPriority
  ): Promise<ApiResponse<{ updated: number }>> {
    const { data: tokenData, error: tokenError } = await getToken();
    if (tokenError || !tokenData?.token) {
      return {
        success: false,
        message: "Authentication required",
        error: { code: "UNAUTHORIZED", message: "Please sign in to continue" },
      };
    }
    return apiFetch<{ updated: number }>(
      `/api/${userId}/tasks/bulk`,
      {
        method: "POST",
        body: JSON.stringify({
          action: "update_priority",
          task_ids: taskIds,
          priority,
        }),
      },
      tokenData.token
    );
  }

  // ==================== Statistics Methods ====================

  async getTaskStatistics(userId: string): Promise<
    ApiResponse<{
      total: number;
      completed: number;
      pending: number;
      overdue: number;
      by_priority: {
        low: number;
        medium: number;
        high: number;
      };
    }>
  > {
    const { data: tokenData, error: tokenError } = await getToken();
    if (tokenError || !tokenData?.token) {
      return {
        success: false,
        message: "Authentication required",
        error: { code: "UNAUTHORIZED", message: "Please sign in to continue" },
      };
    }
    return apiFetch(`/api/${userId}/tasks/statistics`, {}, tokenData.token);
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export default for convenience
export default api;
