import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, Mock } from 'vitest';
import TaskForm from '@/frontend/components/TaskForm';
import { Task, TaskFormData, ApiResponse } from '@/frontend/types';
import { api } from '@/frontend/lib/api';

// Mock the API client
vi.mock('@/frontend/lib/api', () => ({
  api: {
    createTask: vi.fn(),
    updateTask: vi.fn(),
  },
}));

// Mock the utils
vi.mock('@/frontend/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
  sanitizeInput: (input: string) => input,
}));

// Mock the LoadingSpinner component
vi.mock('@/frontend/components/LoadingSpinner', () => ({
  default: ({ size, label }: { size: string; label?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>
      {label || 'Loading...'}
    </div>
  ),
}));

// Define the mock API functions
const mockCreateTask = api.createTask as Mock;
const mockUpdateTask = api.updateTask as Mock;

describe('TaskForm', () => {
  const mockUserId = 'user-123';
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders create task form correctly', () => {
      render(
        <TaskForm
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByLabelText('Title *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Priority')).toBeInTheDocument();
      expect(screen.getByLabelText('Due Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Tags')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Task' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add tag' })).toBeInTheDocument();
    });

    test('renders edit task form correctly when initialData is provided', () => {
      const mockTask: Task = {
        id: 1,
        user_id: mockUserId,
        title: 'Test Task',
        description: 'Test Description',
        completed: false,
        priority: 'high',
        due_date: '2024-12-31',
        tags: ['work', 'important'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      render(
        <TaskForm
          userId={mockUserId}
          initialData={mockTask}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          submitLabel="Update Task"
        />
      );

      expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toHaveValue('high');
      expect(screen.getByDisplayValue('2024-12-31')).toBeInTheDocument();
      expect(screen.getByText('work')).toBeInTheDocument();
      expect(screen.getByText('important')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Update Task' })).toBeInTheDocument();
    });

    test('renders cancel button when onCancel is provided', () => {
      render(
        <TaskForm
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('shows error when title is empty', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const submitButton = screen.getByRole('button', { name: 'Create Task' });
      await user.click(submitButton);

      expect(await screen.findByText('Title is required')).toBeInTheDocument();
    });

    test('shows error when title exceeds 200 characters', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const titleInput = screen.getByLabelText('Title *');
      await user.type(titleInput, 'a'.repeat(201)); // 201 characters

      const submitButton = screen.getByRole('button', { name: 'Create Task' });
      await user.click(submitButton);

      expect(await screen.findByText('Title must be 200 characters or less')).toBeInTheDocument();
    });

    test('shows error when due date is in the past', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const dueDateInput = screen.getByLabelText('Due Date');
      await user.type(dueDateInput, '2020-01-01'); // Past date

      const submitButton = screen.getByRole('button', { name: 'Create Task' });
      await user.click(submitButton);

      expect(await screen.findByText('Due date cannot be in the past')).toBeInTheDocument();
    });

    test('shows error when description exceeds 1000 characters', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const descriptionInput = screen.getByLabelText('Description');
      await user.type(descriptionInput, 'a'.repeat(1001)); // 1001 characters

      const titleInput = screen.getByLabelText('Title *');
      await user.type(titleInput, 'Valid Title');

      const submitButton = screen.getByRole('button', { name: 'Create Task' });
      await user.click(submitButton);

      expect(await screen.findByText('Description must be 1000 characters or less')).toBeInTheDocument();
    });

    test('clears error when user starts typing in a field with error', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const submitButton = screen.getByRole('button', { name: 'Create Task' });
      await user.click(submitButton);

      expect(await screen.findByText('Title is required')).toBeInTheDocument();

      const titleInput = screen.getByLabelText('Title *');
      await user.type(titleInput, 'Valid Title');

      expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission - Create Task', () => {
    test('calls createTask API when creating a new task', async () => {
      const user = userEvent.setup();
      const mockTaskData: TaskFormData = {
        title: 'New Task',
        description: 'New Description',
        priority: 'medium',
        due_date: '2024-12-31',
        tags: ['work'],
      };

      mockCreateTask.mockResolvedValue({
        success: true,
        data: {
          id: 1,
          user_id: mockUserId,
          ...mockTaskData,
          completed: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      });

      render(
        <TaskForm
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      await user.type(screen.getByLabelText('Title *'), 'New Task');
      await user.type(screen.getByLabelText('Description'), 'New Description');
      await user.selectOptions(screen.getByRole('combobox'), 'medium');
      await user.type(screen.getByLabelText('Due Date'), '2024-12-31');

      // Add a tag
      await user.type(screen.getByLabelText('tag-input'), 'work');
      await user.click(screen.getByRole('button', { name: 'Add tag' }));

      await user.click(screen.getByRole('button', { name: 'Create Task' }));

      await waitFor(() => {
        expect(mockCreateTask).toHaveBeenCalledWith(mockUserId, {
          title: 'New Task',
          description: 'New Description',
          priority: 'medium',
          due_date: '2024-12-31',
          tags: ['work'],
        });
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    test('handles API error during task creation', async () => {
      const user = userEvent.setup();
      mockCreateTask.mockResolvedValue({
        success: false,
        message: 'Failed to create task',
      });

      render(
        <TaskForm
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      await user.type(screen.getByLabelText('Title *'), 'New Task');
      await user.click(screen.getByRole('button', { name: 'Create Task' }));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
        expect(screen.getByText('Failed to create task')).toBeInTheDocument();
      });
    });

    test('shows loading state during submission', async () => {
      const user = userEvent.setup();
      mockCreateTask.mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          data: {
            id: 1,
            user_id: mockUserId,
            title: 'New Task',
            description: 'New Description',
            completed: false,
            priority: 'medium',
            due_date: '2024-12-31',
            tags: ['work'],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        }), 100);
      }));

      render(
        <TaskForm
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      await user.type(screen.getByLabelText('Title *'), 'New Task');
      await user.click(screen.getByRole('button', { name: 'Create Task' }));

      // Check that loading spinner appears
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Wait for the promise to resolve
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission - Update Task', () => {
    test('calls updateTask API when updating an existing task', async () => {
      const user = userEvent.setup();
      const mockTask: Task = {
        id: 1,
        user_id: mockUserId,
        title: 'Old Task',
        description: 'Old Description',
        completed: false,
        priority: 'low',
        due_date: '2023-12-31',
        tags: ['old'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const updatedTaskData: TaskFormData = {
        title: 'Updated Task',
        description: 'Updated Description',
        priority: 'high',
        due_date: '2024-12-31',
        tags: ['new', 'updated'],
      };

      mockUpdateTask.mockResolvedValue({
        success: true,
        data: {
          ...mockTask,
          ...updatedTaskData,
          updated_at: '2024-01-02T00:00:00Z',
        },
      });

      render(
        <TaskForm
          userId={mockUserId}
          initialData={mockTask}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          submitLabel="Update Task"
        />
      );

      // Clear and update fields
      await user.clear(screen.getByLabelText('Title *'));
      await user.type(screen.getByLabelText('Title *'), 'Updated Task');
      await user.clear(screen.getByLabelText('Description'));
      await user.type(screen.getByLabelText('Description'), 'Updated Description');
      await user.selectOptions(screen.getByRole('combobox'), 'high');
      await user.type(screen.getByLabelText('Due Date'), '2024-12-31');

      // Remove old tag and add new ones
      await user.click(screen.getByLabelText('Remove tag old'));
      await user.type(screen.getByLabelText('tag-input'), 'new');
      await user.click(screen.getByRole('button', { name: 'Add tag' }));
      await user.type(screen.getByLabelText('tag-input'), 'updated');
      await user.click(screen.getByRole('button', { name: 'Add tag' }));

      await user.click(screen.getByRole('button', { name: 'Update Task' }));

      await waitFor(() => {
        expect(mockUpdateTask).toHaveBeenCalledWith(mockUserId, 1, {
          title: 'Updated Task',
          description: 'Updated Description',
          priority: 'high',
          due_date: '2024-12-31',
          tags: ['new', 'updated'],
        });
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Tag Management', () => {
    test('adds a tag when user types and clicks Add button', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      await user.type(screen.getByLabelText('tag-input'), 'work');
      await user.click(screen.getByRole('button', { name: 'Add tag' }));

      expect(screen.getByText('work')).toBeInTheDocument();
    });

    test('adds a tag when user presses Enter', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const tagInput = screen.getByLabelText('tag-input');
      await user.type(tagInput, 'home');
      await user.keyboard('{Enter}');

      expect(screen.getByText('home')).toBeInTheDocument();
    });

    test('does not add duplicate tags', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      await user.type(screen.getByLabelText('tag-input'), 'work');
      await user.click(screen.getByRole('button', { name: 'Add tag' }));
      await user.type(screen.getByLabelText('tag-input'), 'work');
      await user.click(screen.getByRole('button', { name: 'Add tag' }));

      // Should only have one 'work' tag
      const workTags = screen.getAllByText('work');
      expect(workTags).toHaveLength(1);
    });

    test('removes a tag when remove button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      await user.type(screen.getByLabelText('tag-input'), 'work');
      await user.click(screen.getByRole('button', { name: 'Add tag' }));

      expect(screen.getByText('work')).toBeInTheDocument();

      await user.click(screen.getByLabelText('Remove tag work'));

      expect(screen.queryByText('work')).not.toBeInTheDocument();
    });

    test('does not add empty tag', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      await user.type(screen.getByLabelText('tag-input'), '   '); // Just spaces
      await user.click(screen.getByRole('button', { name: 'Add tag' }));

      expect(screen.queryByText('')).not.toBeInTheDocument();
    });
  });

  describe('Form Reset', () => {
    test('resets form after successful creation (not update)', async () => {
      const user = userEvent.setup();
      mockCreateTask.mockResolvedValue({
        success: true,
        data: {
          id: 1,
          user_id: mockUserId,
          title: 'New Task',
          description: 'New Description',
          completed: false,
          priority: 'medium',
          due_date: '2024-12-31',
          tags: [],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      });

      render(
        <TaskForm
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      await user.type(screen.getByLabelText('Title *'), 'New Task');
      await user.type(screen.getByLabelText('Description'), 'New Description');
      await user.selectOptions(screen.getByRole('combobox'), 'medium');
      await user.type(screen.getByLabelText('Due Date'), '2024-12-31');

      await user.click(screen.getByRole('button', { name: 'Create Task' }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        expect((screen.getByLabelText('Title *') as HTMLInputElement).value).toBe('');
        expect((screen.getByLabelText('Description') as HTMLTextAreaElement).value).toBe('');
        expect(screen.getByRole('combobox')).toHaveValue('medium'); // Default value
        expect((screen.getByLabelText('Due Date') as HTMLInputElement).value).toBe('');
      });
    });

    test('does not reset form after successful update', async () => {
      const user = userEvent.setup();
      const mockTask: Task = {
        id: 1,
        user_id: mockUserId,
        title: 'Old Task',
        description: 'Old Description',
        completed: false,
        priority: 'low',
        due_date: '2023-12-31',
        tags: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockUpdateTask.mockResolvedValue({
        success: true,
        data: {
          ...mockTask,
          title: 'Updated Task',
          updated_at: '2024-01-02T00:00:00Z',
        },
      });

      render(
        <TaskForm
          userId={mockUserId}
          initialData={mockTask}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          submitLabel="Update Task"
        />
      );

      await user.clear(screen.getByLabelText('Title *'));
      await user.type(screen.getByLabelText('Title *'), 'Updated Task');
      await user.click(screen.getByRole('button', { name: 'Update Task' }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        // Form should retain updated values (would be handled by parent component)
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper aria attributes for form elements', () => {
      render(
        <TaskForm
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const titleInput = screen.getByLabelText('Title *');
      expect(titleInput).toHaveAttribute('aria-required', 'true');
      expect(titleInput).toHaveAttribute('aria-invalid', 'false');

      const descriptionInput = screen.getByLabelText('Description');
      expect(descriptionInput).toHaveAttribute('aria-invalid', 'false');

      const dueDateInput = screen.getByLabelText('Due Date');
      expect(dueDateInput).toHaveAttribute('aria-invalid', 'false');
    });

    test('updates aria-invalid when errors occur', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const submitButton = screen.getByRole('button', { name: 'Create Task' });
      await user.click(submitButton);

      const titleInput = screen.getByLabelText('Title *');
      await waitFor(() => {
        expect(titleInput).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });
});