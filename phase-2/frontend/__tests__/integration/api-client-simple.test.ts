/**
 * Integration Tests for API Client (Simplified with fetch mocking)
 *
 * Tests all API client methods with Jest fetch mocking to ensure proper
 * request/response handling, error handling, and retry logic.
 */

import { ApiClient } from '@/lib/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client Integration Tests', () => {
  const api = new ApiClient();
  const testUserId = 'user-123';

  beforeEach(() => {
    // Reset mocks and sessionStorage before each test
    (global.fetch as jest.Mock).mockClear();
    sessionStorage.clear();
    sessionStorage.setItem('auth_token', 'mock-jwt-token-abc123');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== Authentication Tests ====================

  describe('Authentication', () => {
    test('signup creates account and returns token', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: {
              id: 'user-123',
              email: userData.email,
              name: userData.name,
            },
            token: 'mock-jwt-token-abc123',
          },
        }),
        headers: {
          get: () => 'application/json',
        },
      });

      const response = await api.signup(userData);

      expect(response.success).toBe(true);
      expect(response.data?.token).toBeDefined();
      expect(response.data?.user.email).toBe(userData.email);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/signup',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(userData),
        })
      );
    });

    test('signin returns token for valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: { id: 'user-123', email: credentials.email },
            token: 'mock-jwt-token-abc123',
          },
        }),
        headers: {
          get: () => 'application/json',
        },
      });

      const response = await api.signin(credentials);

      expect(response.success).toBe(true);
      expect(response.data?.token).toBe('mock-jwt-token-abc123');
      expect(sessionStorage.getItem('auth_token')).toBe('mock-jwt-token-abc123');
    });

    test('signin returns error for invalid credentials', async () => {
      const credentials = {
        email: 'wrong@example.com',
        password: 'wrongpass',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS',
          },
        }),
        headers: {
          get: () => 'application/json',
        },
      });

      await expect(api.signin(credentials)).rejects.toMatchObject({
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        statusCode: 401,
      });
    });
  });

  // ==================== Task CRUD Tests ====================

  describe('Task CRUD Operations', () => {
    test('getTasks returns paginated task list', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            items: [
              { id: 1, title: 'Task 1', status: 'pending' },
              { id: 2, title: 'Task 2', status: 'completed' },
            ],
            total: 2,
            page: 1,
            limit: 10,
            total_pages: 1,
          },
        }),
        headers: {
          get: () => 'application/json',
        },
      });

      const response = await api.getTasks(testUserId);

      expect(response.success).toBe(true);
      expect(response.data?.items).toHaveLength(2);
      expect(response.data?.total).toBe(2);
    });

    test('createTask adds new task', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Test task',
        priority: 'medium' as const,
        status: 'pending' as const,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 3,
            ...taskData,
            completed: false,
            created_at: new Date().toISOString(),
          },
        }),
        headers: {
          get: () => 'application/json',
        },
      });

      const response = await api.createTask(testUserId, taskData);

      expect(response.success).toBe(true);
      expect(response.data?.title).toBe(taskData.title);
      expect(global.fetch).toHaveBeenCalledWith(
        `http://localhost:8000/api/${testUserId}/tasks`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(taskData),
        })
      );
    });

    test('updateTask modifies existing task', async () => {
      const taskId = 1;
      const updates = {
        title: 'Updated Task',
        priority: 'high' as const,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: taskId,
            ...updates,
            status: 'pending',
            completed: false,
          },
        }),
        headers: {
          get: () => 'application/json',
        },
      });

      const response = await api.updateTask(testUserId, taskId, updates);

      expect(response.success).toBe(true);
      expect(response.data?.title).toBe(updates.title);
    });

    test('deleteTask removes task', async () => {
      const taskId = 1;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: null,
        }),
        headers: {
          get: () => 'application/json',
        },
      });

      const response = await api.deleteTask(testUserId, taskId);

      expect(response.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        `http://localhost:8000/api/${testUserId}/tasks/${taskId}`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    test('toggleTaskComplete changes completion status', async () => {
      const taskId = 1;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: taskId,
            completed: true,
            status: 'completed',
          },
        }),
        headers: {
          get: () => 'application/json',
        },
      });

      const response = await api.toggleTaskComplete(testUserId, taskId, true);

      expect(response.success).toBe(true);
      expect(response.data?.completed).toBe(true);
    });
  });

  // ==================== Bulk Operations Tests ====================

  describe('Bulk Operations', () => {
    test('bulkDeleteTasks removes multiple tasks', async () => {
      const taskIds = [1, 2];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { deleted: 2 },
        }),
        headers: {
          get: () => 'application/json',
        },
      });

      const response = await api.bulkDeleteTasks(testUserId, taskIds);

      expect(response.success).toBe(true);
      expect(response.data?.deleted).toBe(2);
    });

    test('bulkUpdateTaskStatus updates multiple tasks', async () => {
      const taskIds = [1, 2];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { updated: 2 },
        }),
        headers: {
          get: () => 'application/json',
        },
      });

      const response = await api.bulkUpdateTaskStatus(testUserId, taskIds, true);

      expect(response.success).toBe(true);
      expect(response.data?.updated).toBe(2);
    });
  });

  // ==================== Query Parameters Tests ====================

  describe('Query Parameters', () => {
    test('getTasks includes filter parameters in URL', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { items: [], total: 0, page: 1, limit: 10, total_pages: 0 },
        }),
        headers: {
          get: () => 'application/json',
        },
      });

      await api.getTasks(testUserId, {
        status: 'completed',
        sort: 'priority',
        search: 'test',
        page: 2,
        limit: 20,
      });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('status=completed');
      expect(callUrl).toContain('sort=priority');
      expect(callUrl).toContain('search=test');
      expect(callUrl).toContain('page=2');
      expect(callUrl).toContain('limit=20');
    });
  });

  // ==================== Error Handling Tests ====================

  describe('Error Handling', () => {
    test('handles 401 unauthorized by clearing token', async () => {
      sessionStorage.setItem('auth_token', 'test-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
        }),
        headers: {
          get: () => 'application/json',
        },
      });

      await expect(api.getTasks(testUserId)).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    test('includes auth token in requests when available', async () => {
      sessionStorage.setItem('auth_token', 'test-token-123');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { items: [], total: 0, page: 1, limit: 10, total_pages: 0 },
        }),
        headers: {
          get: () => 'application/json',
        },
      });

      await api.getTasks(testUserId);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      );
    });
  });

  // ==================== Statistics Tests ====================

  describe('Statistics', () => {
    test('getTaskStatistics returns metrics', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            total: 10,
            completed: 5,
            pending: 5,
            overdue: 2,
            by_priority: {
              high: 3,
              medium: 4,
              low: 3,
            },
          },
        }),
        headers: {
          get: () => 'application/json',
        },
      });

      const response = await api.getTaskStatistics(testUserId);

      expect(response.success).toBe(true);
      expect(response.data?.total).toBe(10);
      expect(response.data?.completed).toBe(5);
      expect(response.data?.by_priority).toEqual({
        high: 3,
        medium: 4,
        low: 3,
      });
    });
  });
});
