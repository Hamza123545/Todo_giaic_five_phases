/**
 * MSW Request Handlers for API Mocking
 *
 * These handlers intercept network requests during integration testing
 * and return mock responses to simulate backend behavior.
 */

import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'http://localhost:8000';

// Mock data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
};

const mockToken = 'mock-jwt-token-abc123';

let mockTasks: any[] = [
  {
    id: 1,
    title: 'Test Task 1',
    description: 'First test task',
    status: 'pending',
    priority: 'high',
    completed: false,
    user_id: 'user-123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'Test Task 2',
    description: 'Second test task',
    status: 'completed',
    priority: 'medium',
    completed: true,
    user_id: 'user-123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

let nextTaskId = 3;

export const handlers = [
  // ==================== Authentication ====================

  // Signup
  http.post(`${API_BASE_URL}/api/auth/signup`, async ({ request }) => {
    const body = await request.json() as any;

    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: 'user-123',
          email: body.email,
          name: body.name,
        },
        token: mockToken,
      },
    });
  }),

  // Signin
  http.post(`${API_BASE_URL}/api/auth/signin`, async ({ request }) => {
    const body = await request.json() as any;

    // Simulate failed login
    if (body.email === 'wrong@example.com') {
      return HttpResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS',
          },
        },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: mockUser,
        token: mockToken,
      },
    });
  }),

  // Signout
  http.post(`${API_BASE_URL}/api/auth/signout`, () => {
    return HttpResponse.json({
      success: true,
      data: null,
    });
  }),

  // ==================== Tasks ====================

  // Get tasks (with filtering, sorting, pagination)
  http.get(`${API_BASE_URL}/api/:userId/tasks`, ({ request, params }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const sort = url.searchParams.get('sort');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    let filteredTasks = [...mockTasks];

    // Apply filters
    if (status) {
      filteredTasks = filteredTasks.filter((task) => task.status === status);
    }

    if (search) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(search.toLowerCase()) ||
          task.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply sorting
    if (sort === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      filteredTasks.sort(
        (a, b) => priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
      );
    } else if (sort === 'created_at') {
      filteredTasks.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

    return HttpResponse.json({
      success: true,
      data: {
        items: paginatedTasks,
        total: filteredTasks.length,
        page,
        limit,
        total_pages: Math.ceil(filteredTasks.length / limit),
      },
    });
  }),

  // Create task
  http.post(`${API_BASE_URL}/api/:userId/tasks`, async ({ request, params }) => {
    const body = await request.json() as any;

    const newTask = {
      id: nextTaskId++,
      ...body,
      completed: false,
      user_id: params.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockTasks.push(newTask);

    return HttpResponse.json({
      success: true,
      data: newTask,
    });
  }),

  // Get single task
  http.get(`${API_BASE_URL}/api/:userId/tasks/:taskId`, ({ params }) => {
    const task = mockTasks.find((t) => t.id === parseInt(params.taskId as string));

    if (!task) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            message: 'Task not found',
            code: 'TASK_NOT_FOUND',
          },
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: task,
    });
  }),

  // Update task
  http.put(`${API_BASE_URL}/api/:userId/tasks/:taskId`, async ({ request, params }) => {
    const taskId = parseInt(params.taskId as string);
    const body = await request.json() as any;
    const taskIndex = mockTasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            message: 'Task not found',
            code: 'TASK_NOT_FOUND',
          },
        },
        { status: 404 }
      );
    }

    mockTasks[taskIndex] = {
      ...mockTasks[taskIndex],
      ...body,
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: mockTasks[taskIndex],
    });
  }),

  // Delete task
  http.delete(`${API_BASE_URL}/api/:userId/tasks/:taskId`, ({ params }) => {
    const taskId = parseInt(params.taskId as string);
    const taskIndex = mockTasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            message: 'Task not found',
            code: 'TASK_NOT_FOUND',
          },
        },
        { status: 404 }
      );
    }

    mockTasks.splice(taskIndex, 1);

    return HttpResponse.json({
      success: true,
      data: null,
    });
  }),

  // Toggle task complete
  http.patch(`${API_BASE_URL}/api/:userId/tasks/:taskId/complete`, async ({ request, params }) => {
    const taskId = parseInt(params.taskId as string);
    const body = await request.json() as any;
    const taskIndex = mockTasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            message: 'Task not found',
            code: 'TASK_NOT_FOUND',
          },
        },
        { status: 404 }
      );
    }

    mockTasks[taskIndex].completed = body.completed;
    mockTasks[taskIndex].status = body.completed ? 'completed' : 'pending';
    mockTasks[taskIndex].updated_at = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: mockTasks[taskIndex],
    });
  }),

  // Bulk delete
  http.post(`${API_BASE_URL}/api/:userId/tasks/bulk`, async ({ request }) => {
    const body = await request.json() as any;
    const { action, task_ids } = body;

    if (action === 'delete') {
      mockTasks = mockTasks.filter((task) => !task_ids.includes(task.id));
      return HttpResponse.json({
        success: true,
        data: { deleted: task_ids.length },
      });
    }

    if (action === 'update_status') {
      const { completed } = body;
      let updated = 0;
      mockTasks = mockTasks.map((task) => {
        if (task_ids.includes(task.id)) {
          updated++;
          return {
            ...task,
            completed,
            status: completed ? 'completed' : 'pending',
            updated_at: new Date().toISOString(),
          };
        }
        return task;
      });
      return HttpResponse.json({
        success: true,
        data: { updated },
      });
    }

    if (action === 'update_priority') {
      const { priority } = body;
      let updated = 0;
      mockTasks = mockTasks.map((task) => {
        if (task_ids.includes(task.id)) {
          updated++;
          return {
            ...task,
            priority,
            updated_at: new Date().toISOString(),
          };
        }
        return task;
      });
      return HttpResponse.json({
        success: true,
        data: { updated },
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: { message: 'Invalid action', code: 'INVALID_ACTION' },
      },
      { status: 400 }
    );
  }),

  // Reorder tasks
  http.post(`${API_BASE_URL}/api/:userId/tasks/reorder`, async ({ request }) => {
    const body = await request.json() as any;
    const { task_ids } = body;

    return HttpResponse.json({
      success: true,
      data: { reordered: task_ids.length },
    });
  }),

  // Get statistics
  http.get(`${API_BASE_URL}/api/:userId/tasks/statistics`, () => {
    const completed = mockTasks.filter((t) => t.completed).length;
    const pending = mockTasks.filter((t) => !t.completed).length;

    return HttpResponse.json({
      success: true,
      data: {
        total: mockTasks.length,
        completed,
        pending,
        overdue: 0,
        by_priority: {
          high: mockTasks.filter((t) => t.priority === 'high').length,
          medium: mockTasks.filter((t) => t.priority === 'medium').length,
          low: mockTasks.filter((t) => t.priority === 'low').length,
        },
      },
    });
  }),
];

// Reset function for tests
export function resetMockTasks() {
  mockTasks = [
    {
      id: 1,
      title: 'Test Task 1',
      description: 'First test task',
      status: 'pending',
      priority: 'high',
      completed: false,
      user_id: 'user-123',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 2,
      title: 'Test Task 2',
      description: 'Second test task',
      status: 'completed',
      priority: 'medium',
      completed: true,
      user_id: 'user-123',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ];
  nextTaskId = 3;
}
