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
  ApiResponse,
  PaginatedResponse,
  User,
  UserSignupData,
  UserCredentials,
  AuthResponse,
  ImportResult,
  ExportFormat,
} from "@/types";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

/**
 * Get JWT token from secure storage
 */
const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;

  // Try to get token from sessionStorage (more secure than localStorage)
  // In production, this should be httpOnly cookies handled by the backend
  const token = sessionStorage.getItem("auth_token");
  return token;
};

/**
 * Delay utility for retry logic
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Handle API errors and redirect to login if unauthorized
 */
const handleApiError = (error: any, statusCode?: number): never => {
  // Redirect to login on 401 Unauthorized
  if (statusCode === 401) {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth_token");
      window.location.href = "/signin";
    }
  }

  throw {
    message: error.message || "An error occurred",
    code: error.code || "UNKNOWN_ERROR",
    statusCode: statusCode || 500,
  };
};

/**
 * Generic fetch wrapper with retry logic and error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<ApiResponse<T>> {
  const token = getAuthToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Attach JWT token if available
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
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
        handleApiError(
          { message: `HTTP error ${response.status}` },
          response.status
        );
      }
      return { success: true, data: {} as T };
    }

    const data = await response.json();

    // Handle errors
    if (!response.ok) {
      handleApiError(data.error || data, response.status);
    }

    return data;
  } catch (error: any) {
    // Retry on network errors
    if (retries > 0 && error.name === "TypeError") {
      await delay(RETRY_DELAY);
      return apiFetch<T>(endpoint, options, retries - 1);
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
    const response = await apiFetch<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    // Store token if signup successful
    if (response.success && response.data?.token) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("auth_token", response.data.token);
      }
    }

    return response;
  }

  async signin(credentials: UserCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await apiFetch<AuthResponse>("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    // Store token if signin successful
    if (response.success && response.data?.token) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("auth_token", response.data.token);
      }
    }

    return response;
  }

  async signout(): Promise<ApiResponse<void>> {
    const response = await apiFetch<void>("/api/auth/signout", {
      method: "POST",
    });

    // Remove token on signout
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth_token");
    }

    return response;
  }

  // ==================== Task Management Methods ====================

  async getTasks(
    userId: string,
    queryParams?: TaskQueryParams
  ): Promise<ApiResponse<PaginatedResponse<Task>>> {
    const params = new URLSearchParams();

    if (queryParams?.status) params.append("status", queryParams.status);
    if (queryParams?.sort) params.append("sort", queryParams.sort);
    if (queryParams?.search) params.append("search", queryParams.search);
    if (queryParams?.page) params.append("page", queryParams.page.toString());
    if (queryParams?.limit) params.append("limit", queryParams.limit.toString());

    const queryString = params.toString();
    const endpoint = `/api/${userId}/tasks${queryString ? `?${queryString}` : ""}`;

    return apiFetch<PaginatedResponse<Task>>(endpoint);
  }

  async createTask(
    userId: string,
    taskData: TaskFormData
  ): Promise<ApiResponse<Task>> {
    return apiFetch<Task>(`/api/${userId}/tasks`, {
      method: "POST",
      body: JSON.stringify(taskData),
    });
  }

  async getTaskById(userId: string, taskId: number): Promise<ApiResponse<Task>> {
    return apiFetch<Task>(`/api/${userId}/tasks/${taskId}`);
  }

  async updateTask(
    userId: string,
    taskId: number,
    taskData: Partial<TaskFormData>
  ): Promise<ApiResponse<Task>> {
    return apiFetch<Task>(`/api/${userId}/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(userId: string, taskId: number): Promise<ApiResponse<void>> {
    return apiFetch<void>(`/api/${userId}/tasks/${taskId}`, {
      method: "DELETE",
    });
  }

  async toggleTaskComplete(
    userId: string,
    taskId: number,
    completed: boolean
  ): Promise<ApiResponse<Task>> {
    return apiFetch<Task>(`/api/${userId}/tasks/${taskId}/complete`, {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    });
  }

  // ==================== Export/Import Methods ====================

  async exportTasks(userId: string, format: ExportFormat): Promise<Blob> {
    const token = getAuthToken();
    const headers: HeadersInit = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/${userId}/tasks/export?format=${format}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error("Export failed");
    }

    return response.blob();
  }

  async importTasks(
    userId: string,
    file: File
  ): Promise<ApiResponse<ImportResult>> {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append("file", file);

    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/${userId}/tasks/import`, {
      method: "POST",
      headers,
      body: formData,
    });

    return response.json();
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export default for convenience
export default api;
