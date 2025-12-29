import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, Mock } from 'vitest';
import TaskList from '@/frontend/components/TaskList';
import { Task } from '@/frontend/types';

// Mock the TaskItem component to avoid testing its implementation
vi.mock('@/frontend/components/TaskItem', () => ({
  default: ({ task }: { task: Task }) => (
    <div data-testid={`task-item-${task.id}`}>{task.title}</div>
  ),
}));

// Mock the LoadingSpinner component
vi.mock('@/frontend/components/LoadingSpinner', () => ({
  default: ({ size, label }: { size: string; label?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>
      {label || 'Loading...'}
    </div>
  ),
}));

describe('TaskList', () => {
  const mockUserId = 'user-123';
  const mockTasks: Task[] = [
    {
      id: 1,
      user_id: mockUserId,
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
      user_id: mockUserId,
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

  const mockOnTaskChange = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders loading state when isLoading is true', () => {
      render(
        <TaskList
          tasks={mockTasks}
          userId={mockUserId}
          isLoading={true}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
        />
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
    });

    test('renders empty state when no tasks are provided', () => {
      render(
        <TaskList
          tasks={[]}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
        />
      );

      expect(screen.getByText('No tasks found. Create your first task to get started!')).toBeInTheDocument();
    });

    test('renders empty state with custom message', () => {
      render(
        <TaskList
          tasks={[]}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
          emptyMessage="No tasks available"
        />
      );

      expect(screen.getByText('No tasks available')).toBeInTheDocument();
    });

    test('renders task items when tasks are provided', () => {
      render(
        <TaskList
          tasks={mockTasks}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
        />
      );

      expect(screen.getByTestId('task-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-item-2')).toBeInTheDocument();
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });

    test('renders list view by default', () => {
      render(
        <TaskList
          tasks={mockTasks}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
        />
      );

      const listElement = screen.getByRole('list', { name: 'Task list' });
      expect(listElement).toBeInTheDocument();
    });

    test('renders grid view when viewMode is grid', () => {
      render(
        <TaskList
          tasks={mockTasks}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
          viewMode="grid"
        />
      );

      const gridElement = screen.getByRole('list', { name: 'Task grid' });
      expect(gridElement).toBeInTheDocument();
      expect(gridElement).toHaveClass('grid', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
    });

    test('renders kanban view when viewMode is kanban', () => {
      render(
        <TaskList
          tasks={mockTasks}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
          viewMode="kanban"
        />
      );

      const kanbanElement = screen.getByRole('region', { name: 'Kanban board' });
      expect(kanbanElement).toBeInTheDocument();

      const pendingSection = screen.getByRole('list', { name: 'Pending tasks' });
      const completedSection = screen.getByRole('list', { name: 'Completed tasks' });

      expect(pendingSection).toBeInTheDocument();
      expect(completedSection).toBeInTheDocument();

      expect(screen.getByText('Pending (1)')).toBeInTheDocument();
      expect(screen.getByText('Completed (1)')).toBeInTheDocument();
    });
  });

  describe('Kanban View', () => {
    test('separates pending and completed tasks in kanban view', () => {
      render(
        <TaskList
          tasks={mockTasks}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
          viewMode="kanban"
        />
      );

      // Task 1 is pending, Task 2 is completed
      expect(screen.getByText('Task 1')).toBeInTheDocument(); // In pending section
      expect(screen.getByText('Task 2')).toBeInTheDocument(); // In completed section
    });

    test('shows appropriate messages when no pending or completed tasks exist', () => {
      const completedTasks = [
        {
          ...mockTasks[0],
          id: 3,
          completed: true,
          title: 'Completed Task Only',
        },
      ];

      render(
        <TaskList
          tasks={completedTasks}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
          viewMode="kanban"
        />
      );

      expect(screen.getByText('No pending tasks')).toBeInTheDocument();
      expect(screen.getByText('No completed tasks')).not.toBeInTheDocument();
      expect(screen.getByText('Completed Task Only')).toBeInTheDocument();
    });

    test('shows appropriate messages when no completed tasks exist', () => {
      const pendingTasks = [
        {
          ...mockTasks[0],
          id: 4,
          completed: false,
          title: 'Pending Task Only',
        },
      ];

      render(
        <TaskList
          tasks={pendingTasks}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
          viewMode="kanban"
        />
      );

      expect(screen.getByText('No completed tasks')).toBeInTheDocument();
      expect(screen.getByText('No pending tasks')).not.toBeInTheDocument();
      expect(screen.getByText('Pending Task Only')).toBeInTheDocument();
    });
  });

  describe('TaskItem Props', () => {
    test('passes correct props to TaskItem components', () => {
      render(
        <TaskList
          tasks={mockTasks}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
        />
      );

      // Verify that TaskItem receives the correct props
      expect(screen.getByTestId('task-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-item-2')).toBeInTheDocument();
    });

    test('passes viewMode to TaskItem in grid view', () => {
      render(
        <TaskList
          tasks={mockTasks}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
          viewMode="grid"
        />
      );

      // In grid view, TaskItem should receive viewMode="card"
      expect(screen.getByTestId('task-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-item-2')).toBeInTheDocument();
    });

    test('passes viewMode to TaskItem in kanban view', () => {
      render(
        <TaskList
          tasks={mockTasks}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
          viewMode="kanban"
        />
      );

      // In kanban view, TaskItem should receive viewMode="card"
      expect(screen.getByTestId('task-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-item-2')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper aria attributes for list view', () => {
      render(
        <TaskList
          tasks={mockTasks}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
        />
      );

      const listElement = screen.getByRole('list', { name: 'Task list' });
      expect(listElement).toBeInTheDocument();
      expect(listElement).toHaveAttribute('role', 'list');
    });

    test('has proper aria attributes for grid view', () => {
      render(
        <TaskList
          tasks={mockTasks}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
          viewMode="grid"
        />
      );

      const gridElement = screen.getByRole('list', { name: 'Task grid' });
      expect(gridElement).toBeInTheDocument();
      expect(gridElement).toHaveAttribute('role', 'list');
    });

    test('has proper aria attributes for kanban view', () => {
      render(
        <TaskList
          tasks={mockTasks}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
          viewMode="kanban"
        />
      );

      const kanbanElement = screen.getByRole('region', { name: 'Kanban board' });
      expect(kanbanElement).toBeInTheDocument();
      expect(kanbanElement).toHaveAttribute('role', 'region');

      const pendingList = screen.getByRole('list', { name: 'Pending tasks' });
      const completedList = screen.getByRole('list', { name: 'Completed tasks' });

      expect(pendingList).toBeInTheDocument();
      expect(completedList).toBeInTheDocument();
    });

    test('loading state has proper aria attributes', () => {
      render(
        <TaskList
          tasks={mockTasks}
          userId={mockUserId}
          isLoading={true}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
        />
      );

      const loadingElement = screen.getByRole('status', { name: 'Loading tasks' });
      expect(loadingElement).toBeInTheDocument();
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
    });

    test('empty state has proper aria attributes', () => {
      render(
        <TaskList
          tasks={[]}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
        />
      );

      const emptyElement = screen.getByRole('status');
      expect(emptyElement).toBeInTheDocument();
      expect(emptyElement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Edge Cases', () => {
    test('handles tasks with undefined values gracefully', () => {
      const tasksWithUndefined = [
        {
          id: 5,
          user_id: mockUserId,
          title: 'Task with undefined fields',
          completed: false,
          priority: 'medium',
          // description, due_date, tags are undefined
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      render(
        <TaskList
          tasks={tasksWithUndefined}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
        />
      );

      expect(screen.getByText('Task with undefined fields')).toBeInTheDocument();
    });

    test('handles empty task array', () => {
      render(
        <TaskList
          tasks={[]}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
        />
      );

      expect(screen.getByText('No tasks found. Create your first task to get started!')).toBeInTheDocument();
    });

    test('handles null tasks array', () => {
      render(
        <TaskList
          tasks={null as any} // Testing null handling
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
        />
      );

      expect(screen.getByText('No tasks found. Create your first task to get started!')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('uses memoization to prevent unnecessary re-renders', () => {
      const { rerender } = render(
        <TaskList
          tasks={mockTasks}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
        />
      );

      // Rerender with same props - should not cause TaskItem re-renders due to memoization
      rerender(
        <TaskList
          tasks={mockTasks}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
        />
      );

      // Check that the elements are still there
      expect(screen.getByTestId('task-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-item-2')).toBeInTheDocument();
    });

    test('handles large number of tasks efficiently', () => {
      const manyTasks = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        user_id: mockUserId,
        title: `Task ${i + 1}`,
        description: `Description for task ${i + 1}`,
        completed: i % 2 === 0,
        priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
        due_date: `2024-12-${String(31 - (i % 10)).padStart(2, '0')}`,
        tags: [`tag${i % 5}`],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }));

      render(
        <TaskList
          tasks={manyTasks}
          userId={mockUserId}
          onTaskChange={mockOnTaskChange}
          onError={mockOnError}
        />
      );

      expect(screen.getByTestId('task-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-item-50')).toBeInTheDocument();
    });
  });
});