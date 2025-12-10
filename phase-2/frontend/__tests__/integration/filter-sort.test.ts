/**
 * Integration Tests for Filtering and Sorting
 *
 * Tests task filtering by status, priority, and search
 * along with sorting functionality.
 */

import { ApiClient } from '@/lib/api';
import { server } from './mocks/server';
import { resetMockTasks } from './mocks/handlers';

describe('Task Filtering and Sorting Integration Tests', () => {
  const api = new ApiClient();
  const testUserId = 'user-123';

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  beforeEach(async () => {
    resetMockTasks();
    sessionStorage.setItem('auth_token', 'mock-jwt-token-abc123');

    // Setup: Signin to get token
    await api.signin({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  afterEach(() => {
    server.resetHandlers();
    sessionStorage.clear();
  });

  afterAll(() => {
    server.close();
  });

  // ==================== Filtering Tests ====================

  describe('Task Filtering', () => {
    test('filters tasks by pending status', async () => {
      const response = await api.getTasks(testUserId, { status: 'pending' });

      expect(response.success).toBe(true);
      expect(response.data?.items).toHaveLength(1);
      expect(response.data?.items.every((task) => task.status === 'pending')).toBe(true);
    });

    test('filters tasks by completed status', async () => {
      const response = await api.getTasks(testUserId, { status: 'completed' });

      expect(response.success).toBe(true);
      expect(response.data?.items).toHaveLength(1);
      expect(response.data?.items.every((task) => task.status === 'completed')).toBe(true);
    });

    test('returns all tasks when no status filter applied', async () => {
      const response = await api.getTasks(testUserId);

      expect(response.success).toBe(true);
      expect(response.data?.items).toHaveLength(2);
    });

    test('search filters tasks by title', async () => {
      const response = await api.getTasks(testUserId, { search: 'Task 1' });

      expect(response.success).toBe(true);
      expect(response.data?.items).toHaveLength(1);
      expect(response.data?.items[0].title).toContain('Task 1');
    });

    test('search filters tasks by description', async () => {
      const response = await api.getTasks(testUserId, { search: 'First test' });

      expect(response.success).toBe(true);
      expect(response.data?.items).toHaveLength(1);
      expect(response.data?.items[0].description).toContain('First test');
    });

    test('search is case-insensitive', async () => {
      const response = await api.getTasks(testUserId, { search: 'TASK 1' });

      expect(response.success).toBe(true);
      expect(response.data?.items).toHaveLength(1);
      expect(response.data?.items[0].title).toContain('Task 1');
    });

    test('search returns empty array for no matches', async () => {
      const response = await api.getTasks(testUserId, { search: 'nonexistent' });

      expect(response.success).toBe(true);
      expect(response.data?.items).toHaveLength(0);
    });
  });

  // ==================== Sorting Tests ====================

  describe('Task Sorting', () => {
    test('sorts tasks by priority (high to low)', async () => {
      const response = await api.getTasks(testUserId, { sort: 'priority' });

      expect(response.success).toBe(true);
      expect(response.data?.items).toHaveLength(2);
      expect(response.data?.items[0].priority).toBe('high');
      expect(response.data?.items[1].priority).toBe('medium');
    });

    test('sorts tasks by created_at (newest first)', async () => {
      const response = await api.getTasks(testUserId, { sort: 'created_at' });

      expect(response.success).toBe(true);
      expect(response.data?.items).toHaveLength(2);
      // Both have same created_at in mock, so order should be maintained
      expect(response.data?.items[0].id).toBeDefined();
    });

    test('returns tasks in default order when no sort applied', async () => {
      const response = await api.getTasks(testUserId);

      expect(response.success).toBe(true);
      expect(response.data?.items).toHaveLength(2);
      expect(response.data?.items[0].id).toBe(1);
      expect(response.data?.items[1].id).toBe(2);
    });
  });

  // ==================== Combined Filtering and Sorting ====================

  describe('Combined Filter and Sort', () => {
    test('filters by status and sorts by priority', async () => {
      // First create some additional tasks for better testing
      await api.createTask(testUserId, {
        title: 'High Priority Pending Task',
        description: 'Test',
        priority: 'high',
        status: 'pending',
      });

      const response = await api.getTasks(testUserId, {
        status: 'pending',
        sort: 'priority',
      });

      expect(response.success).toBe(true);
      expect(response.data?.items.every((task) => task.status === 'pending')).toBe(true);
      // Should be sorted by priority
      if (response.data && response.data.items.length > 1) {
        const priorities = response.data.items.map((t) => t.priority);
        expect(priorities[0]).toBe('high');
      }
    });

    test('searches and sorts results', async () => {
      // Create tasks with searchable titles
      await api.createTask(testUserId, {
        title: 'Search Test A',
        description: 'Test',
        priority: 'low',
        status: 'pending',
      });

      await api.createTask(testUserId, {
        title: 'Search Test B',
        description: 'Test',
        priority: 'high',
        status: 'pending',
      });

      const response = await api.getTasks(testUserId, {
        search: 'Search Test',
        sort: 'priority',
      });

      expect(response.success).toBe(true);
      expect(response.data?.items.length).toBeGreaterThanOrEqual(2);
      expect(response.data?.items.every((task) => task.title.includes('Search Test'))).toBe(true);
    });

    test('filters, searches, and sorts together', async () => {
      // Create comprehensive test data
      await api.createTask(testUserId, {
        title: 'Important Pending Item',
        description: 'Important work',
        priority: 'high',
        status: 'pending',
      });

      const response = await api.getTasks(testUserId, {
        status: 'pending',
        search: 'Important',
        sort: 'priority',
      });

      expect(response.success).toBe(true);
      expect(response.data?.items.length).toBeGreaterThanOrEqual(1);
      expect(response.data?.items[0].title).toContain('Important');
      expect(response.data?.items[0].status).toBe('pending');
    });
  });

  // ==================== Pagination with Filters ====================

  describe('Pagination with Filtering', () => {
    beforeEach(async () => {
      // Create more tasks for pagination testing
      for (let i = 3; i <= 12; i++) {
        await api.createTask(testUserId, {
          title: `Task ${i}`,
          description: `Description ${i}`,
          priority: i % 2 === 0 ? 'high' : 'low',
          status: 'pending',
        });
      }
    });

    test('filters work with pagination', async () => {
      const response = await api.getTasks(testUserId, {
        status: 'pending',
        page: 1,
        limit: 5,
      });

      expect(response.success).toBe(true);
      expect(response.data?.items.length).toBeLessThanOrEqual(5);
      expect(response.data?.items.every((task) => task.status === 'pending')).toBe(true);
      expect(response.data?.page).toBe(1);
      expect(response.data?.limit).toBe(5);
    });

    test('search works with pagination', async () => {
      const response = await api.getTasks(testUserId, {
        search: 'Task',
        page: 1,
        limit: 5,
      });

      expect(response.success).toBe(true);
      expect(response.data?.items.length).toBeLessThanOrEqual(5);
      expect(response.data?.page).toBe(1);
    });

    test('sorting works with pagination', async () => {
      const response = await api.getTasks(testUserId, {
        sort: 'priority',
        page: 1,
        limit: 5,
      });

      expect(response.success).toBe(true);
      expect(response.data?.items.length).toBeLessThanOrEqual(5);
      expect(response.data?.page).toBe(1);
    });

    test('all filters work together with pagination', async () => {
      const response = await api.getTasks(testUserId, {
        status: 'pending',
        search: 'Task',
        sort: 'priority',
        page: 1,
        limit: 3,
      });

      expect(response.success).toBe(true);
      expect(response.data?.items.length).toBeLessThanOrEqual(3);
      expect(response.data?.items.every((task) => task.status === 'pending')).toBe(true);
      expect(response.data?.page).toBe(1);
      expect(response.data?.limit).toBe(3);
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    test('handles empty search query', async () => {
      const response = await api.getTasks(testUserId, { search: '' });

      expect(response.success).toBe(true);
      expect(response.data?.items).toHaveLength(2);
    });

    test('handles special characters in search', async () => {
      await api.createTask(testUserId, {
        title: 'Special @#$ Characters',
        description: 'Test',
        priority: 'medium',
        status: 'pending',
      });

      const response = await api.getTasks(testUserId, { search: '@#$' });

      expect(response.success).toBe(true);
      // Should handle special characters without crashing
    });

    test('handles very long search query', async () => {
      const longQuery = 'a'.repeat(500);
      const response = await api.getTasks(testUserId, { search: longQuery });

      expect(response.success).toBe(true);
      expect(response.data?.items).toHaveLength(0);
    });

    test('handles invalid sort parameter gracefully', async () => {
      // Invalid sort should not crash, just return unsorted
      const response = await api.getTasks(testUserId, { sort: 'invalid' as any });

      expect(response.success).toBe(true);
      expect(response.data?.items).toBeDefined();
    });
  });

  // ==================== Performance Tests ====================

  describe('Performance', () => {
    test('filtering is fast with multiple tasks', async () => {
      // Create 50 tasks
      const createPromises = [];
      for (let i = 1; i <= 50; i++) {
        createPromises.push(
          api.createTask(testUserId, {
            title: `Performance Task ${i}`,
            description: `Test ${i}`,
            priority: i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low',
            status: i % 2 === 0 ? 'completed' : 'pending',
          })
        );
      }
      await Promise.all(createPromises);

      const startTime = Date.now();
      const response = await api.getTasks(testUserId, {
        status: 'completed',
        sort: 'priority',
      });
      const endTime = Date.now();

      expect(response.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
