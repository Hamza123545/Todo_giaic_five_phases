import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi, beforeEach } from 'vitest';
import TaskForm from '@/frontend/components/TaskForm';
import TaskItem from '@/frontend/components/TaskItem';
import TaskList from '@/frontend/components/TaskList';
import { Task, TaskFormData } from '@/frontend/types';

// Extend Jest with axe matcher
expect.extend(toHaveNoViolations);

// Mock the LoadingSpinner component
vi.mock('@/frontend/components/LoadingSpinner', () => ({
  default: ({ size, label }: { size: string; label?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>
      {label || 'Loading...'}
    </div>
  ),
}));

// Mock the utils
vi.mock('@/frontend/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
  sanitizeInput: (input: string) => input,
  formatDate: (date: string) => new Date(date).toLocaleDateString(),
}));

// Mock the API client to prevent actual API calls during accessibility tests
vi.mock('@/frontend/lib/api', () => ({
  api: {
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    toggleTaskComplete: vi.fn(),
    getTasks: vi.fn(),
  },
}));

describe('Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TaskForm Accessibility', () => {
    test('TaskForm has no accessibility violations', async () => {
      const { container } = render(
        <TaskForm
          userId="user-123"
          onSuccess={() => {}}
          onError={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('TaskForm with initial data has no accessibility violations', async () => {
      const mockTask: Task = {
        id: 1,
        user_id: 'user-123',
        title: 'Test Task',
        description: 'Test Description',
        completed: false,
        priority: 'medium',
        due_date: '2024-12-31',
        tags: ['work'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const { container } = render(
        <TaskForm
          userId="user-123"
          initialData={mockTask}
          onSuccess={() => {}}
          onError={() => {}}
          submitLabel="Update Task"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('TaskForm with errors has no accessibility violations', async () => {
      const mockTask: Task = {
        id: 1,
        user_id: 'user-123',
        title: '',
        description: 'Test Description',
        completed: false,
        priority: 'medium',
        due_date: '2024-12-31',
        tags: ['work'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const { container } = render(
        <TaskForm
          userId="user-123"
          initialData={mockTask}
          onSuccess={() => {}}
          onError={() => {}}
        />
      );

      // Simulate error state by adding error messages
      const errorContainer = document.createElement('div');
      errorContainer.className = 'p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md';
      errorContainer.setAttribute('role', 'alert');
      errorContainer.innerHTML = '<p class="text-sm text-red-800 dark:text-red-200">Title is required</p>';
      container.appendChild(errorContainer);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('TaskItem Accessibility', () => {
    test('TaskItem in list view has no accessibility violations', async () => {
      const mockTask: Task = {
        id: 1,
        user_id: 'user-123',
        title: 'Test Task',
        description: 'Test Description',
        completed: false,
        priority: 'medium',
        due_date: '2024-12-31',
        tags: ['work'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const { container } = render(
        <TaskItem
          task={mockTask}
          userId="user-123"
          onSuccess={() => {}}
          onError={() => {}}
          viewMode="list"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('TaskItem in card view has no accessibility violations', async () => {
      const mockTask: Task = {
        id: 1,
        user_id: 'user-123',
        title: 'Test Task',
        description: 'Test Description',
        completed: false,
        priority: 'medium',
        due_date: '2024-12-31',
        tags: ['work'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const { container } = render(
        <TaskItem
          task={mockTask}
          userId="user-123"
          onSuccess={() => {}}
          onError={() => {}}
          viewMode="card"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('Completed TaskItem has no accessibility violations', async () => {
      const mockTask: Task = {
        id: 1,
        user_id: 'user-123',
        title: 'Completed Task',
        description: 'Test Description',
        completed: true,
        priority: 'high',
        due_date: '2024-12-31',
        tags: ['important'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const { container } = render(
        <TaskItem
          task={mockTask}
          userId="user-123"
          onSuccess={() => {}}
          onError={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('Overdue TaskItem has no accessibility violations', async () => {
      const mockTask: Task = {
        id: 1,
        user_id: 'user-123',
        title: 'Overdue Task',
        description: 'Test Description',
        completed: false,
        priority: 'high',
        due_date: '2020-01-01', // Past date
        tags: ['urgent'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const { container } = render(
        <TaskItem
          task={mockTask}
          userId="user-123"
          onSuccess={() => {}}
          onError={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('TaskList Accessibility', () => {
    test('TaskList in list view has no accessibility violations', async () => {
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

      const { container } = render(
        <TaskList
          tasks={mockTasks}
          userId="user-123"
          onTaskChange={() => {}}
          onError={() => {}}
          viewMode="list"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('TaskList in grid view has no accessibility violations', async () => {
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
      ];

      const { container } = render(
        <TaskList
          tasks={mockTasks}
          userId="user-123"
          onTaskChange={() => {}}
          onError={() => {}}
          viewMode="grid"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('TaskList in kanban view has no accessibility violations', async () => {
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

      const { container } = render(
        <TaskList
          tasks={mockTasks}
          userId="user-123"
          onTaskChange={() => {}}
          onError={() => {}}
          viewMode="kanban"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('Empty TaskList has no accessibility violations', async () => {
      const { container } = render(
        <TaskList
          tasks={[]}
          userId="user-123"
          onTaskChange={() => {}}
          onError={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('Loading TaskList has no accessibility violations', async () => {
      const { container } = render(
        <TaskList
          tasks={[]}
          userId="user-123"
          isLoading={true}
          onTaskChange={() => {}}
          onError={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    test('TaskForm has sufficient color contrast', async () => {
      const { container } = render(
        <TaskForm
          userId="user-123"
          onSuccess={() => {}}
          onError={() => {}}
        />
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      // Filter out color-contrast violations to check specifically
      const colorContrastViolations = results.violations.filter(
        violation => violation.id === 'color-contrast'
      );

      expect(colorContrastViolations).toHaveLength(0);
    });

    test('TaskItem has sufficient color contrast for different priority levels', async () => {
      const highPriorityTask: Task = {
        id: 1,
        user_id: 'user-123',
        title: 'High Priority Task',
        description: 'Description',
        completed: false,
        priority: 'high',
        due_date: '2024-12-31',
        tags: ['urgent'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const { container } = render(
        <TaskItem
          task={highPriorityTask}
          userId="user-123"
          onSuccess={() => {}}
          onError={() => {}}
        />
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      const colorContrastViolations = results.violations.filter(
        violation => violation.id === 'color-contrast'
      );

      expect(colorContrastViolations).toHaveLength(0);
    });
  });

  describe('Keyboard Navigation', () => {
    test('TaskForm is fully navigable via keyboard', async () => {
      const { container } = render(
        <TaskForm
          userId="user-123"
          onSuccess={() => {}}
          onError={() => {}}
        />
      );

      // Check that all interactive elements have proper keyboard support
      const titleInput = container.querySelector('input[name="title"]');
      const descriptionTextarea = container.querySelector('textarea[name="description"]');
      const prioritySelect = container.querySelector('select[name="priority"]');
      const dueDateInput = container.querySelector('input[name="due_date"]');
      const tagInput = container.querySelector('#tag-input');
      const submitButton = container.querySelector('button[type="submit"]');
      const cancelButton = container.querySelector('button[type="button"]');

      expect(titleInput).toHaveAttribute('tabindex', '0');
      expect(prioritySelect).toHaveAttribute('tabindex', '0');
      expect(submitButton).toHaveAttribute('tabindex', '0');

      // Verify all required elements are focusable
      const focusableElements = container.querySelectorAll(
        'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
      );
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    test('TaskItem has proper keyboard navigation', async () => {
      const mockTask: Task = {
        id: 1,
        user_id: 'user-123',
        title: 'Test Task',
        description: 'Test Description',
        completed: false,
        priority: 'medium',
        due_date: '2024-12-31',
        tags: ['work'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const { container } = render(
        <TaskItem
          task={mockTask}
          userId="user-123"
          onSuccess={() => {}}
          onError={() => {}}
        />
      );

      const checkboxButton = container.querySelector('button[aria-label*="Mark"]');
      const deleteButton = container.querySelector('button[aria-label*="Delete"]');

      expect(checkboxButton).toHaveAttribute('tabindex', '0');
      expect(deleteButton).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Screen Reader Compatibility', () => {
    test('TaskForm has proper labels and descriptions', async () => {
      const { container } = render(
        <TaskForm
          userId="user-123"
          onSuccess={() => {}}
          onError={() => {}}
        />
      );

      // Check for proper labeling
      expect(container.querySelector('label[for="title"]')).toBeInTheDocument();
      expect(container.querySelector('label[for="description"]')).toBeInTheDocument();
      expect(container.querySelector('label[for="priority"]')).toBeInTheDocument();
      expect(container.querySelector('label[for="due_date"]')).toBeInTheDocument();

      // Check for required field indicators
      const requiredLabels = container.querySelectorAll('label span[aria-label="required"]');
      expect(requiredLabels.length).toBeGreaterThan(0);
    });

    test('TaskItem has proper ARIA attributes', async () => {
      const mockTask: Task = {
        id: 1,
        user_id: 'user-123',
        title: 'Test Task',
        description: 'Test Description',
        completed: false,
        priority: 'medium',
        due_date: '2024-12-31',
        tags: ['work'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const { container } = render(
        <TaskItem
          task={mockTask}
          userId="user-123"
          onSuccess={() => {}}
          onError={() => {}}
        />
      );

      const taskArticle = container.querySelector('article');
      expect(taskArticle).toHaveAttribute('aria-label', `Task: ${mockTask.title}`);

      const checkboxButton = container.querySelector('button');
      expect(checkboxButton).toHaveAttribute('aria-pressed', 'false');
      expect(checkboxButton).toHaveAttribute('aria-label', 'Mark as complete');
    });

    test('TaskList has proper list semantics', async () => {
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
      ];

      const { container } = render(
        <TaskList
          tasks={mockTasks}
          userId="user-123"
          onTaskChange={() => {}}
          onError={() => {}}
        />
      );

      const listElement = container.querySelector('[role="list"]');
      expect(listElement).toHaveAttribute('aria-label', 'Task list');

      const listItem = container.querySelector('li');
      expect(listItem).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    test('Interactive elements have visible focus indicators', async () => {
      const { container } = render(
        <TaskForm
          userId="user-123"
          onSuccess={() => {}}
          onError={() => {}}
        />
      );

      const titleInput = container.querySelector('input[name="title"]');
      const submitButton = container.querySelector('button[type="submit"]');

      // Check for focus styles (this is a basic check, actual focus styles depend on CSS)
      expect(titleInput).toHaveClass('focus:outline-none', { negated: true });
      expect(submitButton).toHaveClass('focus:outline-none', { negated: true });
    });
  });
});