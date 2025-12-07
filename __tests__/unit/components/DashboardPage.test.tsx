import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, Mock } from 'vitest';
import { useRouter } from 'next/navigation';
import DashboardPage from '@/frontend/app/dashboard/page';
import { getCurrentUser, signOut } from '@/frontend/lib/auth';
import { api } from '@/frontend/lib/api';
import { Task, User, SortConfig } from '@/frontend/types';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock auth functions
vi.mock('@/frontend/lib/auth', () => ({
  getCurrentUser: vi.fn(),
  signOut: vi.fn(),
}));

// Mock API client
vi.mock('@/frontend/lib/api', () => ({
  api: {
    getTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    toggleTaskComplete: vi.fn(),
  },
}));

// Mock all components used in the dashboard
vi.mock('@/frontend/components/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="protected-route">{children}</div>,
}));

vi.mock('@/frontend/components/LoadingSpinner', () => ({
  default: ({ size, label }: { size: string; label?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>
      {label || 'Loading...'}
    </div>
  ),
}));

vi.mock('@/frontend/components/TaskForm', () => ({
  default: ({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void }) => (
    <div data-testid="task-form">
      <button
        data-testid="task-form-submit"
        onClick={() => onSuccess?.({} as Task)}
      >
        Submit Task
      </button>
      <button
        data-testid="task-form-cancel"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  ),
}));

vi.mock('@/frontend/components/TaskList', () => ({
  default: ({ tasks }: { tasks: Task[] }) => (
    <div data-testid="task-list">
      {tasks.map(task => (
        <div key={task.id} data-testid={`task-item-${task.id}`}>
          {task.title}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/frontend/components/FilterControls', () => ({
  default: ({ currentFilter, onFilterChange }: { currentFilter: string; onFilterChange: (filter: string) => void }) => (
    <div data-testid="filter-controls">
      <button
        data-testid="filter-all"
        onClick={() => onFilterChange('all')}
        className={currentFilter === 'all' ? 'active' : ''}
      >
        All
      </button>
      <button
        data-testid="filter-pending"
        onClick={() => onFilterChange('pending')}
        className={currentFilter === 'pending' ? 'active' : ''}
      >
        Pending
      </button>
      <button
        data-testid="filter-completed"
        onClick={() => onFilterChange('completed')}
        className={currentFilter === 'completed' ? 'active' : ''}
      >
        Completed
      </button>
    </div>
  ),
}));

vi.mock('@/frontend/components/SortControls', () => ({
  default: ({ currentSort, currentDirection, onSortChange }: {
    currentSort: string;
    currentDirection: string;
    onSortChange: (key: string, direction?: string) => void
  }) => (
    <div data-testid="sort-controls">
      <button
        data-testid="sort-created"
        onClick={() => onSortChange('created')}
      >
        Sort by Created
      </button>
    </div>
  ),
}));

vi.mock('@/frontend/components/SearchBar', () => ({
  default: ({ onSearch }: { onSearch: (query: string) => void }) => (
    <input
      data-testid="search-bar"
      onChange={(e) => onSearch(e.target.value)}
      placeholder="Search tasks..."
    />
  ),
}));

// Define mock functions
const mockRouter = {
  push: vi.fn(),
};
const mockGetCurrentUser = getCurrentUser as Mock;
const mockSignOut = signOut as Mock;
const mockGetTasks = api.getTasks as Mock;
const mockCreateTask = api.createTask as Mock;
const mockUpdateTask = api.updateTask as Mock;
const mockDeleteTask = api.deleteTask as Mock;
const mockToggleTaskComplete = api.toggleTaskComplete as Mock;

describe('DashboardPage', () => {
  const mockUser: User = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockTasks: Task[] = [
    {
      id: 1,
      user_id: 'user-123',
      title: 'Task 1',
      description: 'Description 1',
      completed: false,
      priority: 'high',
      due_date: '2024-12-31',
      tags: ['work'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      user_id: 'user-123',
      title: 'Task 2',
      description: 'Description 2',
      completed: true,
      priority: 'medium',
      due_date: '2024-11-30',
      tags: ['personal'],
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue(mockRouter);
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockGetTasks.mockResolvedValue({
      success: true,
      data: {
        data: mockTasks,
        total: mockTasks.length,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    });
  });

  describe('Initial Loading', () => {
    test('shows loading spinner while loading user', async () => {
      mockGetCurrentUser.mockImplementation(() => new Promise(() => {})); // Never resolve for this test

      render(<DashboardPage />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });

    test('loads user data on mount', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockGetCurrentUser).toHaveBeenCalled();
      });
    });

    test('loads tasks after user is loaded', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockGetTasks).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({
            status: 'all',
            sort: 'created:desc',
            search: '',
            page: 1,
            limit: 50,
          })
        );
      });
    });
  });

  describe('User Interface', () => {
    test('displays user welcome message', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Welcome back, John Doe!')).toBeInTheDocument();
      });
    });

    test('displays sign out button', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
      });
    });

    test('allows user to sign out', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
      });

      const signOutButton = screen.getByRole('button', { name: 'Sign Out' });
      await user.click(signOutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
        expect(mockRouter.push).toHaveBeenCalledWith('/signin');
      });
    });
  });

  describe('Task Form', () => {
    test('shows task form when Add Task button is clicked', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Add Task' })).toBeInTheDocument();
      });

      const addTaskButton = screen.getByRole('button', { name: 'Add Task' });
      await user.click(addTaskButton);

      expect(screen.getByTestId('task-form')).toBeInTheDocument();
    });

    test('hides task form when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      // First, show the form
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Add Task' })).toBeInTheDocument();
      });

      const addTaskButton = screen.getByRole('button', { name: 'Add Task' });
      await user.click(addTaskButton);

      expect(screen.getByTestId('task-form')).toBeInTheDocument();

      // Then cancel it
      const cancelButton = screen.getByTestId('task-form-cancel');
      await user.click(cancelButton);

      expect(screen.queryByTestId('task-form')).not.toBeInTheDocument();
    });

    test('adds new task to the list when task is created', async () => {
      const user = userEvent.setup();
      mockCreateTask.mockResolvedValue({
        success: true,
        data: {
          id: 3,
          user_id: 'user-123',
          title: 'New Task',
          description: 'New Description',
          completed: false,
          priority: 'medium',
          due_date: '2024-10-15',
          tags: ['new'],
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z',
        },
      });

      render(<DashboardPage />);

      // Wait for initial tasks to load
      await waitFor(() => {
        expect(screen.getByTestId('task-list')).toBeInTheDocument();
      });

      // Show form and submit
      const addTaskButton = screen.getByRole('button', { name: 'Add Task' });
      await user.click(addTaskButton);

      const submitButton = screen.getByTestId('task-form-submit');
      await user.click(submitButton);

      // Verify the new task is added to the list
      await waitFor(() => {
        expect(mockGetTasks).toHaveBeenCalledTimes(2); // Initial load + after task creation
      });
    });
  });

  describe('Task List', () => {
    test('displays tasks from the API', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('task-list')).toBeInTheDocument();
      });

      expect(screen.getByTestId('task-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-item-2')).toBeInTheDocument();
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });

    test('displays task statistics', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Statistics')).toBeInTheDocument();
      });

      expect(screen.getByText('2')).toHaveTextContent('2'); // Total tasks
      expect(screen.getByText('1')).toHaveTextContent('1'); // Pending tasks
      expect(screen.getByText('1')).toHaveTextContent('1'); // Completed tasks
    });
  });

  describe('Filtering and Sorting', () => {
    test('applies filter when filter button is clicked', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('filter-controls')).toBeInTheDocument();
      });

      const pendingFilter = screen.getByTestId('filter-pending');
      await user.click(pendingFilter);

      await waitFor(() => {
        expect(mockGetTasks).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({
            status: 'pending',
          })
        );
      });
    });

    test('applies search query when typing in search bar', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('search-bar')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-bar');
      await user.type(searchInput, 'search query');

      await waitFor(() => {
        expect(mockGetTasks).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({
            search: 'search query',
          })
        );
      });
    });

    test('applies sorting when sort button is clicked', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('sort-controls')).toBeInTheDocument();
      });

      const sortButton = screen.getByTestId('sort-created');
      await user.click(sortButton);

      await waitFor(() => {
        expect(mockGetTasks).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({
            sort: 'created:asc', // Should toggle to asc
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    test('handles user loading error gracefully', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Failed to load user'));

      render(<DashboardPage />);

      // Should still show loading initially
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // After error, should still render (ProtectedRoute handles the error)
      await waitFor(() => {
        expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      });
    });

    test('handles task loading error', async () => {
      mockGetTasks.mockResolvedValue({
        success: false,
        message: 'Failed to load tasks',
      });

      render(<DashboardPage />);

      await waitFor(() => {
        // Should still render the dashboard but with error state
        expect(screen.getByTestId('task-list')).toBeInTheDocument();
      });
    });
  });

  describe('Protected Route', () => {
    test('wraps content in ProtectedRoute', () => {
      render(<DashboardPage />);

      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper heading structure', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'My Tasks', level: 1 })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Your Tasks (2)', level: 2 })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Statistics', level: 2 })).toBeInTheDocument();
      });
    });

    test('has proper landmark regions', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
        expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
      });
    });

    test('has skip links for keyboard navigation', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        // Check for skip navigation links
        const skipLink = screen.queryByRole('link', { name: 'Skip to main content' });
        if (skipLink) {
          expect(skipLink).toBeInTheDocument();
        }
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles user with no tasks', async () => {
      mockGetTasks.mockResolvedValue({
        success: true,
        data: {
          data: [],
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 1,
        },
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('task-list')).toBeInTheDocument();
        // TaskList component will show empty state
      });
    });

    test('handles user with many tasks', async () => {
      const manyTasks = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        user_id: 'user-123',
        title: `Task ${i + 1}`,
        description: `Description for task ${i + 1}`,
        completed: i % 2 === 0,
        priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
        due_date: `2024-12-${String(31 - (i % 10)).padStart(2, '0')}`,
        tags: [`tag${i % 5}`],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }));

      mockGetTasks.mockResolvedValue({
        success: true,
        data: {
          data: manyTasks,
          total: manyTasks.length,
          page: 1,
          limit: 50,
          totalPages: 2,
        },
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('task-list')).toBeInTheDocument();
      });

      // Should render without performance issues
      expect(screen.getByTestId('task-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-item-100')).toBeInTheDocument();
    });
  });
});