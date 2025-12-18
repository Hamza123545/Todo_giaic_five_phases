import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, Mock } from 'vitest';
import TaskItem from '@/frontend/components/TaskItem';
import { Task, ApiResponse } from '@/frontend/types';
import { api } from '@/frontend/lib/api';
import { formatDate } from '@/frontend/lib/utils';

// Mock the API client
vi.mock('@/frontend/lib/api', () => ({
  api: {
    toggleTaskComplete: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

// Mock the utils
vi.mock('@/frontend/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
  formatDate: vi.fn((date: string) => new Date(date).toLocaleDateString()),
}));

// Mock the LoadingSpinner component
vi.mock('@/frontend/components/LoadingSpinner', () => ({
  default: ({ size, color }: { size: string; color: string }) => (
    <div data-testid="loading-spinner" data-size={size} data-color={color} />
  ),
}));

// Define the mock API functions
const mockToggleTaskComplete = api.toggleTaskComplete as Mock;
const mockDeleteTask = api.deleteTask as Mock;
const mockFormatDate = formatDate as Mock;

describe('TaskItem', () => {
  const mockUserId = 'user-123';
  const mockTask: Task = {
    id: 1,
    user_id: mockUserId,
    title: 'Test Task',
    description: 'Test Description',
    completed: false,
    priority: 'medium',
    due_date: '2024-12-31',
    tags: ['work', 'important'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFormatDate.mockImplementation((date: string) => new Date(date).toLocaleDateString());
    window.confirm = vi.fn(() => true); // Mock confirm dialog to return true by default
  });

  describe('Rendering', () => {
    test('renders task information correctly', () => {
      render(
        <TaskItem
          task={mockTask}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('12/31/2024')).toBeInTheDocument();
      expect(screen.getByText('work')).toBeInTheDocument();
      expect(screen.getByText('important')).toBeInTheDocument();
    });

    test('renders task as completed when completed is true', () => {
      const completedTask = { ...mockTask, completed: true };
      render(
        <TaskItem
          task={completedTask}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const titleElement = screen.getByText('Test Task');
      expect(titleElement).toHaveClass('line-through');
      expect(titleElement).toHaveClass('text-gray-500');
    });

    test('renders different priority colors', () => {
      const highPriorityTask = { ...mockTask, priority: 'high' };
      const lowPriorityTask = { ...mockTask, priority: 'low' };

      render(
        <>
          <TaskItem
            task={highPriorityTask}
            userId={mockUserId}
            onSuccess={mockOnSuccess}
            onError={mockOnError}
          />
          <TaskItem
            task={lowPriorityTask}
            userId={mockUserId}
            onSuccess={mockOnSuccess}
            onError={mockOnError}
          />
        </>
      );

      const highPriorityElement = screen.getByText('High');
      const lowPriorityElement = screen.getByText('Low');

      expect(highPriorityElement).toHaveClass('bg-red-100', 'text-red-800');
      expect(lowPriorityElement).toHaveClass('bg-green-100', 'text-green-800');
    });

    test('renders overdue status when due date is in the past and task is not completed', () => {
      const pastDueTask = {
        ...mockTask,
        due_date: '2020-01-01', // Past date
        completed: false,
      };

      render(
        <TaskItem
          task={pastDueTask}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByText('(Overdue)')).toBeInTheDocument();
      expect(screen.getByText('1/1/2020')).toBeInTheDocument();
    });

    test('does not render overdue status when task is completed', () => {
      const pastDueCompletedTask = {
        ...mockTask,
        due_date: '2020-01-01', // Past date
        completed: true,
      };

      render(
        <TaskItem
          task={pastDueCompletedTask}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.queryByText('(Overdue)')).not.toBeInTheDocument();
    });

    test('renders card view when viewMode is card', () => {
      render(
        <TaskItem
          task={mockTask}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          viewMode="card"
        />
      );

      const cardElement = screen.getByLabelText(`Task: ${mockTask.title}`);
      expect(cardElement).toHaveClass('rounded-lg', 'shadow-sm', 'border');
    });

    test('renders truncated tags when there are more than 3', () => {
      const taskWithManyTags = {
        ...mockTask,
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      };

      render(
        <TaskItem
          task={taskWithManyTags}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });
  });

  describe('Toggle Complete', () => {
    test('toggles task completion status when checkbox is clicked', async () => {
      const user = userEvent.setup();
      mockToggleTaskComplete.mockResolvedValue({
        success: true,
        data: { ...mockTask, completed: true },
      });

      render(
        <TaskItem
          task={mockTask}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const checkbox = screen.getByRole('button', { name: 'Mark as complete' });
      await user.click(checkbox);

      await waitFor(() => {
        expect(mockToggleTaskComplete).toHaveBeenCalledWith(mockUserId, 1, true);
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    test('optimistically updates UI when toggling', async () => {
      const user = userEvent.setup();
      // Mock a slow API response to see the optimistic update
      mockToggleTaskComplete.mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          data: { ...mockTask, completed: true },
        }), 100);
      }));

      render(
        <TaskItem
          task={mockTask}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const checkbox = screen.getByRole('button', { name: 'Mark as complete' });
      await user.click(checkbox);

      // Check that the UI updated immediately (optimistic update)
      const titleElement = screen.getByText('Test Task');
      expect(titleElement).toHaveClass('line-through');
      expect(titleElement).toHaveClass('text-gray-500');
    });

    test('reverts optimistic update when API fails', async () => {
      const user = userEvent.setup();
      mockToggleTaskComplete.mockResolvedValue({
        success: false,
        message: 'Failed to update task',
      });

      render(
        <TaskItem
          task={mockTask}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const checkbox = screen.getByRole('button', { name: 'Mark as complete' });
      await user.click(checkbox);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
        // Title should not have line-through class since the update failed
        const titleElement = screen.getByText('Test Task');
        expect(titleElement).not.toHaveClass('line-through');
      });
    });

    test('shows loading state when toggling', async () => {
      const user = userEvent.setup();
      mockToggleTaskComplete.mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          data: { ...mockTask, completed: true },
        }), 100);
      }));

      render(
        <TaskItem
          task={mockTask}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const checkbox = screen.getByRole('button', { name: 'Mark as complete' });
      await user.click(checkbox);

      expect(checkbox).toBeDisabled();
    });
  });

  describe('Delete Task', () => {
    test('deletes task when delete button is clicked', async () => {
      const user = userEvent.setup();
      mockDeleteTask.mockResolvedValue({
        success: true,
      });

      render(
        <TaskItem
          task={mockTask}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const deleteButton = screen.getByRole('button', { name: `Delete task ${mockTask.title}` });
      await user.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith(`Are you sure you want to delete "${mockTask.title}"?`);
      await waitFor(() => {
        expect(mockDeleteTask).toHaveBeenCalledWith(mockUserId, 1);
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    test('does not delete task when user cancels confirmation', async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => false); // Mock to return false

      render(
        <TaskItem
          task={mockTask}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const deleteButton = screen.getByRole('button', { name: `Delete task ${mockTask.title}` });
      await user.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith(`Are you sure you want to delete "${mockTask.title}"?`);
      expect(mockDeleteTask).not.toHaveBeenCalled();
    });

    test('shows loading state when deleting', async () => {
      const user = userEvent.setup();
      mockDeleteTask.mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 100);
      }));

      render(
        <TaskItem
          task={mockTask}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const deleteButton = screen.getByRole('button', { name: `Delete task ${mockTask.title}` });
      await user.click(deleteButton);

      expect(deleteButton).toBeDisabled();
      expect(screen.getByRole('article')).toHaveClass('opacity-50', 'pointer-events-none');
    });

    test('handles delete error', async () => {
      const user = userEvent.setup();
      mockDeleteTask.mockResolvedValue({
        success: false,
        message: 'Failed to delete task',
      });

      render(
        <TaskItem
          task={mockTask}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const deleteButton = screen.getByRole('button', { name: `Delete task ${mockTask.title}` });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
      });
    });
  });

  describe('Card View', () => {
    test('renders card layout properly', () => {
      render(
        <TaskItem
          task={mockTask}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          viewMode="card"
        />
      );

      const cardElement = screen.getByRole('article');
      expect(cardElement).toHaveClass('p-4', 'bg-white', 'rounded-lg', 'shadow-sm', 'border');
    });

    test('card view shows truncated description', () => {
      const taskWithLongDescription = {
        ...mockTask,
        description: 'This is a very long description that should be truncated in the card view to maintain readability and prevent the card from becoming too tall.',
      };

      render(
        <TaskItem
          task={taskWithLongDescription}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          viewMode="card"
        />
      );

      const descriptionElement = screen.getByText(taskWithLongDescription.description);
      expect(descriptionElement).toHaveClass('line-clamp-2');
    });
  });

  describe('Accessibility', () => {
    test('has proper aria attributes for checkbox', () => {
      render(
        <TaskItem
          task={mockTask}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const checkbox = screen.getByRole('button', { name: 'Mark as complete' });
      expect(checkbox).toHaveAttribute('aria-pressed', 'false');
    });

    test('checkbox aria-pressed updates when toggled', async () => {
      const user = userEvent.setup();
      mockToggleTaskComplete.mockResolvedValue({
        success: true,
        data: { ...mockTask, completed: true },
      });

      render(
        <TaskItem
          task={mockTask}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const checkbox = screen.getByRole('button', { name: 'Mark as complete' });
      expect(checkbox).toHaveAttribute('aria-pressed', 'false');

      await user.click(checkbox);

      await waitFor(() => {
        expect(checkbox).toHaveAttribute('aria-pressed', 'true');
      });
    });

    test('has proper aria labels for tags', () => {
      render(
        <TaskItem
          task={mockTask}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const tagsContainer = screen.getByRole('list', { name: 'Tags' });
      expect(tagsContainer).toBeInTheDocument();

      const tagItems = screen.getAllByRole('listitem');
      expect(tagItems).toHaveLength(2); // work and important
    });
  });

  describe('Edge Cases', () => {
    test('handles task without description', () => {
      const taskWithoutDescription = { ...mockTask, description: undefined };
      render(
        <TaskItem
          task={taskWithoutDescription}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    test('handles task without due date', () => {
      const taskWithoutDueDate = { ...mockTask, due_date: undefined };
      render(
        <TaskItem
          task={taskWithoutDueDate}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.queryByText('12/31/2024')).not.toBeInTheDocument();
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    test('handles task without tags', () => {
      const taskWithoutTags = { ...mockTask, tags: undefined };
      render(
        <TaskItem
          task={taskWithoutTags}
          userId={mockUserId}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.queryByText('work')).not.toBeInTheDocument();
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });
  });
});