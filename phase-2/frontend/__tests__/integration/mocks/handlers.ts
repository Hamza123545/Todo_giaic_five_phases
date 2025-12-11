/**
 * MSW Request Handlers for API Mocking
 *
 * These handlers intercept network requests during integration testing
 * and return mock responses to simulate backend behavior.
 */

import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'http://localhost:8000';

// Types for mock data
interface MockTask {
  id: number;
  title: string;
  description: string;
  priority: string;
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  tags?: string[];
}

interface SignupRequestBody {
  email: string;
  name: string;
  password: string;
}

interface SigninRequestBody {
  email: string;
  password: string;
}

interface CreateTaskBody {
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
  tags?: string[];
}

interface UpdateTaskBody {
  title?: string;
  description?: string;
  priority?: string;
  completed?: boolean;
  due_date?: string;
  tags?: string[];
}

interface ToggleCompleteBody {
  completed: boolean;
}

interface BulkOperationBody {
  action: string;
  task_ids: number[];
  completed?: boolean;
  priority?: string;
}

// Mock data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
};

const mockToken = 'mock-jwt-token-abc123';

let mockTasks: MockTask[] = [
  {
    id: 1,
    title: 'Test Task 1',
    description: 'First test task',
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
    const body = await request.json() as SignupRequestBody;

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
    } as unknown as HttpResponse);
  }),

  // Signin
  http.post(`${API_BASE_URL}/api/auth/signin`, async ({ request }) => {
    const body = await request.json() as SigninRequestBody;

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
      ) as unknown as HttpResponse;
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: mockUser,
        token: mockToken,
      },
    } as unknown as HttpResponse);
  }),

  // Signout
  http.post(`${API_BASE_URL}/api/auth/signout`, () => {
    return HttpResponse.json({
      success: true,
      data: null,
    } as unknown as HttpResponse);
  }),

  // ==================== Tasks ====================

  // Get tasks (with filtering, sorting, pagination)
  http.get(`${API_BASE_URL}/api/:userId/tasks`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const sort = url.searchParams.get('sort');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    let filteredTasks = [...mockTasks];

    // Apply filters
    if (status) {
      if (status === 'completed') {
        filteredTasks = filteredTasks.filter((task) => task.completed);
      } else if (status === 'pending') {
        filteredTasks = filteredTasks.filter((task) => !task.completed);
      }
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
        totalPages: Math.ceil(filteredTasks.length / limit),
      },
    } as unknown as HttpResponse);
  }),

  // Create task
  http.post(`${API_BASE_URL}/api/:userId/tasks`, async ({ request, params }) => {
    const body = await request.json() as CreateTaskBody;

    const newTask: MockTask = {
      id: nextTaskId++,
      title: body.title,
      description: body.description || '',
      priority: body.priority || 'medium',
      completed: false,
      user_id: params.userId as string,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockTasks.push(newTask);

    return HttpResponse.json({
      success: true,
      data: newTask,
    } as unknown as HttpResponse);
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
      ) as unknown as HttpResponse;
    }

    return HttpResponse.json({
      success: true,
      data: task,
    } as unknown as HttpResponse);
  }),

  // Update task
  // @ts-expect-error - MSW type inference issue with union return types
  http.put(`${API_BASE_URL}/api/:userId/tasks/:taskId`, async ({ request, params }) => {
    const taskId = parseInt(params.taskId as string);
    const body = await request.json() as UpdateTaskBody;
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

    const updatedTask: MockTask = {
      ...mockTasks[taskIndex],
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description || '' }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.completed !== undefined && { completed: body.completed }),
      ...(body.due_date !== undefined && { due_date: body.due_date }),
      ...(body.tags !== undefined && { tags: body.tags }),
      updated_at: new Date().toISOString(),
    };
    mockTasks[taskIndex] = updatedTask;

    return HttpResponse.json({
      success: true,
      data: mockTasks[taskIndex],
    } as unknown as HttpResponse);
  }),

  // Delete task
  // @ts-expect-error - MSW type inference issue with union return types
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
    } as unknown as HttpResponse);
  }),

  // Toggle task complete
  // @ts-expect-error - MSW type inference issue with union return types
  http.patch(`${API_BASE_URL}/api/:userId/tasks/:taskId/complete`, async ({ request, params }) => {
    const taskId = parseInt(params.taskId as string);
    const body = await request.json() as ToggleCompleteBody;
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
      completed: body.completed,
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: mockTasks[taskIndex],
    } as unknown as HttpResponse);
  }),

  // Bulk delete
  http.post(`${API_BASE_URL}/api/:userId/tasks/bulk`, async ({ request }) => {
    const body = await request.json() as BulkOperationBody;
    const { action, task_ids } = body;

    if (action === 'delete') {
      mockTasks = mockTasks.filter((task) => !task_ids.includes(task.id));
      return HttpResponse.json({
        success: true,
        data: { deleted: task_ids.length },
      } as unknown as HttpResponse);
    }

    if (action === 'update_status') {
      const { completed } = body;
      let updated = 0;
      mockTasks = mockTasks.map((task) => {
        if (task_ids.includes(task.id)) {
          updated++;
          return {
            ...task,
            completed: completed ?? task.completed,
            updated_at: new Date().toISOString(),
          };
        }
        return task;
      });
      return HttpResponse.json({
        success: true,
        data: { updated },
      } as unknown as HttpResponse);
    }

    if (action === 'update_priority') {
      const { priority } = body;
      if (!priority) {
        return HttpResponse.json(
          {
            success: false,
            error: { message: 'Priority is required', code: 'MISSING_PRIORITY' },
          },
          { status: 400 }
        ) as unknown as HttpResponse;
      }
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
      } as unknown as HttpResponse);
    }

    return HttpResponse.json(
      {
        success: false,
        error: { message: 'Invalid action', code: 'INVALID_ACTION' },
      },
      { status: 400 }
    ) as unknown as HttpResponse;
  }),

  // Reorder tasks
  http.post(`${API_BASE_URL}/api/:userId/tasks/reorder`, async ({ request }) => {
    const body = (await request.json()) as { task_ids: number[] };
    const { task_ids } = body;

    return HttpResponse.json({
      success: true,
      data: { reordered: task_ids.length },
    } as unknown as HttpResponse);
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
    } as unknown as HttpResponse);
  }),
];

// Reset function for tests
export function resetMockTasks() {
  mockTasks = [
    {
      id: 1,
      title: 'Test Task 1',
      description: 'First test task',
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
      priority: 'medium',
      completed: true,
      user_id: 'user-123',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ];
  nextTaskId = 3;
}
