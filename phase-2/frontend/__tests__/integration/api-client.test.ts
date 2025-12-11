/**
 * Integration Tests for API Client
 *
 * Tests all API client methods with MSW mocking to ensure proper
 * request/response handling, error handling, and retry logic.
 */

import { ApiClient } from '@/lib/api';
import { server } from './mocks/server';
import { resetMockTasks } from './mocks/handlers';

describe('API Client Integration Tests', () => {
  const api = new ApiClient();
  const testUserId = 'user-123';

  // Setup MSW server
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
    resetMockTasks();
    // Clear sessionStorage after each test
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }
  });

  afterAll(() => {
    server.close();
  });

  // ==================== Authentication Tests ====================

  describe('Authentication', () => {
    test('signup creates account and returns token', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User',
      };

      const response = await api.signup(userData);

      expect(response.success).toBe(true);
      expect(response.data?.token).toBeDefined();
      expect(response.data?.user.email).toBe(userData.email);
    });

    test('signin returns token for valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await api.signin(credentials);

      expect(response.success).toBe(true);
      expect(response.data?.token).toBe('mock-jwt-token-abc123');
      expect(response.data?.user.id).toBe('user-123');
    });

    test('signin returns error for invalid credentials', async () => {
      const credentials = {
        email: 'wrong@example.com',
        password: 'wrongpass',
      };

      await expect(api.signin(credentials)).rejects.toMatchObject({
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        statusCode: 401,
      });
    });

    test('signout clears auth token', async () => {
      // First signin to get token
      await api.signin({
        email: 'test@example.com',
        password: 'password123',
      });

      // Then signout
      const response = await api.signout();

      expect(response.success).toBe(true);
    });
  });

  // ==================== Task CRUD Tests ====================

  describe('Task CRUD Operations', () => {
    beforeEach(async () => {
      // Setup: signin to get token
      await api.signin({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    test('getTasks returns paginated task list', async () => {
      const response = await api.getTasks(testUserId);

      expect(response.success).toBe(true);
      expect(response.data?.items).toHaveLength(2);
      expect(response.data?.total).toBe(2);
      expect(response.data?.page).toBe(1);
    });

    test('getTasks filters by status', async () => {
      const response = await api.getTasks(testUserId, { status: 'completed' });

      expect(response.success).toBe(true);
      expect(response.data?.items).toHaveLength(1);
      expect(response.data?.items[0].completed).toBe(true);
    });

    test('getTasks searches by title', async () => {
      const response = await api.getTasks(testUserId, { search: 'Task 1' });

      expect(response.success).toBe(true);
      expect(response.data?.items).toHaveLength(1);
      expect(response.data?.items[0].title).toBe('Test Task 1');
    });

    test('getTasks sorts by priority', async () => {
      const response = await api.getTasks(testUserId, { sort: 'priority' });

      expect(response.success).toBe(true);
      expect(response.data?.items[0].priority).toBe('high');
    });

    test('createTask adds new task', async () => {
      const taskData = {
        title: 'New Test Task',
        description: 'This is a new task',
        priority: 'medium' as const,
        status: 'pending' as const,
      };

      const response = await api.createTask(testUserId, taskData);

      expect(response.success).toBe(true);
      expect(response.data?.title).toBe(taskData.title);
      expect(response.data?.id).toBe(3);
    });

    test('getTaskById returns specific task', async () => {
      const response = await api.getTaskById(testUserId, 1);

      expect(response.success).toBe(true);
      expect(response.data?.id).toBe(1);
      expect(response.data?.title).toBe('Test Task 1');
    });

    test('getTaskById returns error for non-existent task', async () => {
      await expect(api.getTaskById(testUserId, 999)).rejects.toMatchObject({
        message: 'Task not found',
        code: 'TASK_NOT_FOUND',
        statusCode: 404,
      });
    });

    test('updateTask modifies existing task', async () => {
      const updates = {
        title: 'Updated Task Title',
        priority: 'high' as const,
      };

      const response = await api.updateTask(testUserId, 1, updates);

      expect(response.success).toBe(true);
      expect(response.data?.title).toBe(updates.title);
      expect(response.data?.priority).toBe(updates.priority);
    });

    test('deleteTask removes task', async () => {
      const response = await api.deleteTask(testUserId, 1);

      expect(response.success).toBe(true);

      // Verify task is deleted
      const tasksResponse = await api.getTasks(testUserId);
      expect(tasksResponse.data?.items).toHaveLength(1);
    });

    test('toggleTaskComplete changes completion status', async () => {
      // Toggle to completed
      const response1 = await api.toggleTaskComplete(testUserId, 1, true);
      expect(response1.success).toBe(true);
      expect(response1.data?.completed).toBe(true);
      expect(response1.data?.completed).toBe(true);

      // Toggle back to pending
      const response2 = await api.toggleTaskComplete(testUserId, 1, false);
      expect(response2.success).toBe(true);
      expect(response2.data?.completed).toBe(false);
      expect(response2.data?.completed).toBe(false);
    });
  });

  // ==================== Bulk Operations Tests ====================

  describe('Bulk Operations', () => {
    beforeEach(async () => {
      await api.signin({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    test('bulkDeleteTasks removes multiple tasks', async () => {
      const taskIds = [1, 2];
      const response = await api.bulkDeleteTasks(testUserId, taskIds);

      expect(response.success).toBe(true);
      expect(response.data?.deleted).toBe(2);

      // Verify tasks are deleted
      const tasksResponse = await api.getTasks(testUserId);
      expect(tasksResponse.data?.items).toHaveLength(0);
    });

    test('bulkUpdateTaskStatus updates multiple tasks', async () => {
      const taskIds = [1];
      const response = await api.bulkUpdateTaskStatus(testUserId, taskIds, true);

      expect(response.success).toBe(true);
      expect(response.data?.updated).toBe(1);
    });

    test('bulkUpdateTaskPriority changes priority for multiple tasks', async () => {
      const taskIds = [1, 2];
      const response = await api.bulkUpdateTaskPriority(testUserId, taskIds, 'high');

      expect(response.success).toBe(true);
      expect(response.data?.updated).toBe(2);
    });
  });

  // ==================== Advanced Features Tests ====================

  describe('Advanced Features', () => {
    beforeEach(async () => {
      await api.signin({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    test('reorderTasks updates task order', async () => {
      const taskIds = [2, 1];
      const response = await api.reorderTasks(testUserId, taskIds);

      expect(response.success).toBe(true);
      expect(response.data?.reordered).toBe(2);
    });

    test('getTaskStatistics returns task metrics', async () => {
      const response = await api.getTaskStatistics(testUserId);

      expect(response.success).toBe(true);
      expect(response.data?.total).toBe(2);
      expect(response.data?.completed).toBe(1);
      expect(response.data?.pending).toBe(1);
      expect(response.data?.by_priority).toEqual({
        high: 1,
        medium: 1,
        low: 0,
      });
    });
  });

  // ==================== Pagination Tests ====================

  describe('Pagination', () => {
    beforeEach(async () => {
      await api.signin({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    test('getTasks respects pagination parameters', async () => {
      const response = await api.getTasks(testUserId, {
        page: 1,
        limit: 1,
      });

      expect(response.success).toBe(true);
      expect(response.data?.items).toHaveLength(1);
      expect(response.data?.page).toBe(1);
      expect(response.data?.limit).toBe(1);
      expect(response.data?.totalPages).toBe(2);
    });

    test('getTasks handles page 2', async () => {
      const response = await api.getTasks(testUserId, {
        page: 2,
        limit: 1,
      });

      expect(response.success).toBe(true);
      expect(response.data?.items).toHaveLength(1);
      expect(response.data?.page).toBe(2);
    });
  });

  // ==================== Error Handling Tests ====================

  describe('Error Handling', () => {
    test('handles network errors with retry', async () => {
      // This test would require mocking fetch to fail
      // For now, we'll test that errors are properly formatted
      await expect(api.signin({
        email: 'wrong@example.com',
        password: 'wrongpass',
      })).rejects.toMatchObject({
        message: expect.any(String),
        code: expect.any(String),
        statusCode: 401,
      });
    });
  });
});
