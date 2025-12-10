# Testing Guide

This document provides comprehensive testing guidelines and instructions for the Frontend Todo Application.

## Table of Contents

- [Testing Strategy](#testing-strategy)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [End-to-End Tests](#end-to-end-tests)
- [Accessibility Tests](#accessibility-tests)
- [Performance Tests](#performance-tests)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Coverage Reports](#coverage-reports)
- [CI/CD Integration](#cicd-integration)

## Testing Strategy

### Test Pyramid

```
       /\
      /E2E\         <- Few (Critical user journeys)
     /------\
    /Integration\   <- Some (Component interactions)
   /------------\
  /  Unit Tests  \  <- Many (Individual components)
 /----------------\
```

### Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical user flows
- **E2E Tests**: Main user journeys (auth, CRUD, filtering)
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Lighthouse scores >90

## Unit Tests

### Current Status

✅ **Completed Components**:
- LoadingSpinner.test.tsx
- SearchBar.test.tsx
- DarkModeToggle.test.tsx
- TaskItem.test.tsx

🔲 **TODO - Remaining Components**:

#### High Priority
- [ ] TaskList.test.tsx
- [ ] TaskForm.test.tsx
- [ ] FilterControls.test.tsx
- [ ] SortControls.test.tsx

#### Medium Priority
- [ ] TaskStatistics.test.tsx
- [ ] TaskDetailModal.test.tsx
- [ ] ExportImportControls.test.tsx
- [ ] BulkActions.test.tsx
- [ ] PaginationControls.test.tsx

#### Low Priority
- [ ] ErrorBoundary.test.tsx
- [ ] ProtectedRoute.test.tsx
- [ ] ToastNotification.test.tsx
- [ ] KeyboardShortcuts.test.tsx

### Example Unit Test Template

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComponentName from '../ComponentName';

// Mock dependencies
jest.mock('@/lib/api', () => ({
  api: {
    someMethod: jest.fn(),
  },
}));

describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<ComponentName />);
      expect(screen.getByRole('...')).toBeInTheDocument();
    });

    it('renders with custom props', () => {
      render(<ComponentName prop="value" />);
      expect(screen.getByText('value')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles button click', async () => {
      const user = userEvent.setup();
      const mockFn = jest.fn();
      render(<ComponentName onClick={mockFn} />);

      await user.click(screen.getByRole('button'));
      expect(mockFn).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ComponentName />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', '...');
    });
  });

  describe('Error Handling', () => {
    it('displays error message on failure', async () => {
      // Test error scenarios
    });
  });
});
```

### Running Unit Tests

```bash
# Run all tests
pnpm run test

# Watch mode
pnpm run test:watch

# Coverage report
pnpm run test:coverage

# Specific file
pnpm run test SearchBar.test.tsx
```

## Integration Tests

### TODO - Integration Test Suite (T077)

Create `__tests__/integration/` directory with:

#### API Client Tests
- [ ] api-client.test.ts
  - Test all API methods with MSW (Mock Service Worker)
  - Test error handling and retries
  - Test token refresh logic
  - Test offline behavior

#### User Flow Tests
- [ ] task-crud-flow.test.tsx
  - Create task → View in list → Edit → Delete
  - Test optimistic updates
  - Test error recovery

- [ ] filtering-flow.test.tsx
  - Apply filter → Verify results → Change filter → Clear filter
  - Test multiple filter combinations

- [ ] search-flow.test.tsx
  - Enter search → Debounce → Results appear → Clear search

#### Authentication Flow Tests
- [ ] auth-flow.test.tsx
  - Signup → Signin → Protected route access → Signout
  - Test token expiration
  - Test invalid credentials

### Integration Test Example

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import Dashboard from '@/app/dashboard/page';

// Setup MSW server
const server = setupServer(
  rest.get('/api/:userId/tasks', (req, res, ctx) => {
    return res(ctx.json({ data: [...mockTasks] }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Task CRUD Flow', () => {
  it('completes full task lifecycle', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    // Create task
    const input = screen.getByPlaceholderText(/add a task/i);
    await user.type(input, 'New task{Enter}');

    // Verify task appears
    await waitFor(() => {
      expect(screen.getByText('New task')).toBeInTheDocument();
    });

    // Edit task
    await user.dblClick(screen.getByText('New task'));
    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'Updated task{Enter}');

    // Verify update
    await waitFor(() => {
      expect(screen.getByText('Updated task')).toBeInTheDocument();
    });

    // Delete task
    await user.click(screen.getByLabelText(/delete task/i));

    // Verify deletion
    await waitFor(() => {
      expect(screen.queryByText('Updated task')).not.toBeInTheDocument();
    });
  });
});
```

## End-to-End Tests

### TODO - Playwright E2E Tests (T078)

Create `e2e/` directory with:

#### Critical User Journeys
- [ ] e2e/auth.spec.ts
  - Full authentication flow
  - Password validation
  - Error handling

- [ ] e2e/task-management.spec.ts
  - Create, edit, delete tasks
  - Mark complete/incomplete
  - Task details modal

- [ ] e2e/filtering-sorting.spec.ts
  - Filter by status, priority
  - Sort by date, title
  - Search functionality

- [ ] e2e/export-import.spec.ts
  - Export tasks as CSV/JSON
  - Import tasks from file
  - Validation and error handling

- [ ] e2e/offline.spec.ts
  - Work offline
  - Create tasks offline
  - Sync when back online

### Playwright Configuration

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow user to sign up and sign in', async ({ page }) => {
    // Navigate to signup
    await page.goto('/signup');

    // Fill signup form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="name"]', 'Test User');
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome, Test User')).toBeVisible();

    // Sign out
    await page.click('button[aria-label="Sign out"]');
    await expect(page).toHaveURL('/signin');

    // Sign in
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');

    // Verify signed in
    await expect(page).toHaveURL('/dashboard');
  });
});
```

### Running E2E Tests

```bash
# Install Playwright browsers
pnpm exec playwright install

# Run all E2E tests
pnpm run test:e2e

# Run in UI mode
pnpm run test:e2e --ui

# Run specific browser
pnpm run test:e2e --project=chromium

# Debug mode
pnpm run test:e2e --debug
```

## Accessibility Tests

### TODO - Accessibility Testing (T079)

#### Automated Accessibility Testing

Install axe-core:
```bash
pnpm add -D @axe-core/playwright
```

Create `e2e/accessibility.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/dashboard');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation works correctly', async ({ page }) => {
    await page.goto('/dashboard');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('role', 'button');

    // Test keyboard shortcuts
    await page.keyboard.press('Control+K');
    await expect(page.locator('input[type="search"]')).toBeFocused();
  });

  test('screen reader announces task updates', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for live regions
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeVisible();

    // Create task and verify announcement
    await page.fill('input[name="title"]', 'New task');
    await page.click('button[type="submit"]');

    await expect(liveRegion).toContainText('Task created');
  });
});
```

#### Manual Accessibility Checklist

- [ ] All interactive elements accessible via keyboard
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] ARIA labels on all buttons and inputs
- [ ] Screen reader compatibility tested
- [ ] Color contrast ratios ≥4.5:1 for normal text
- [ ] Color contrast ratios ≥3:1 for large text
- [ ] No keyboard traps
- [ ] Skip navigation links present
- [ ] Form validation errors announced
- [ ] Loading states announced to screen readers

### Running Accessibility Tests

```bash
# Automated tests
pnpm run test:e2e accessibility.spec.ts

# Axe CLI scan
npx @axe-core/cli http://localhost:3000 --exit

# Lighthouse accessibility audit
pnpm run lighthouse
```

## Performance Tests

### TODO - Performance Testing (T080)

#### Lighthouse CI

Already configured in `lighthouserc.json`. Run with:

```bash
# Start server
pnpm run build && pnpm run start &

# Run Lighthouse
npx lighthouse http://localhost:3000 --output=html --output-path=./lighthouse-report.html

# Or use Lighthouse CI
npx lhci autorun
```

#### Performance Metrics to Monitor

```typescript
// Create e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('Core Web Vitals meet thresholds', async ({ page }) => {
    await page.goto('/dashboard');

    const performanceTiming = JSON.parse(
      await page.evaluate(() => JSON.stringify(performance.timing))
    );

    // Calculate metrics
    const loadTime = performanceTiming.loadEventEnd - performanceTiming.navigationStart;
    expect(loadTime).toBeLessThan(3000); // < 3 seconds

    // Test First Contentful Paint
    const paintMetrics = await page.evaluate(() =>
      JSON.stringify(performance.getEntriesByType('paint'))
    );
    const fcp = JSON.parse(paintMetrics).find(
      (m: any) => m.name === 'first-contentful-paint'
    );
    expect(fcp.startTime).toBeLessThan(2000);
  });

  test('Large task lists render efficiently', async ({ page }) => {
    await page.goto('/dashboard');

    // Mock 1000+ tasks
    await page.route('**/api/*/tasks*', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: Array(1000).fill(null).map((_, i) => ({
            id: i,
            title: `Task ${i}`,
            completed: false,
          })),
        }),
      });
    });

    const startTime = Date.now();
    await page.reload();
    await page.waitForSelector('[data-testid="task-item"]');
    const renderTime = Date.now() - startTime;

    expect(renderTime).toBeLessThan(3000); // Should render in < 3s
  });
});
```

#### Bundle Size Analysis

```bash
# Analyze bundle
ANALYZE=true pnpm run build

# Check bundle size
pnpm exec next build --profile
```

### Performance Optimization Checklist

- [ ] Bundle size < 300KB (first load)
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 3s
- [ ] Time to Interactive < 3s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Code splitting implemented
- [ ] Images optimized
- [ ] Fonts preloaded
- [ ] Critical CSS inlined

## Coverage Reports

### Viewing Coverage

```bash
# Generate coverage report
pnpm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage Thresholds

Configured in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

## CI/CD Integration

All tests run automatically in GitHub Actions (`.github/workflows/frontend-ci.yml`):

1. **Lint** - ESLint checks
2. **TypeCheck** - TypeScript compilation
3. **Unit Tests** - Jest with coverage
4. **Build** - Production build
5. **E2E Tests** - Playwright across browsers
6. **Accessibility** - Axe accessibility tests
7. **Performance** - Lighthouse CI
8. **Security** - npm audit + secrets scan

## Writing Tests Best Practices

### 1. Follow AAA Pattern

```typescript
test('should do something', () => {
  // Arrange
  const component = <Component prop="value" />;

  // Act
  render(component);
  fireEvent.click(screen.getByRole('button'));

  // Assert
  expect(screen.getByText('Result')).toBeInTheDocument();
});
```

### 2. Use Testing Library Queries

Priority:
1. `getByRole` - Preferred (accessibility-focused)
2. `getByLabelText` - Form elements
3. `getByPlaceholderText` - Last resort
4. Avoid `getByTestId` unless necessary

### 3. Test User Behavior, Not Implementation

```typescript
// ❌ Bad - Testing implementation
expect(component.state.count).toBe(1);

// ✅ Good - Testing user-visible behavior
expect(screen.getByText('Count: 1')).toBeInTheDocument();
```

### 4. Mock External Dependencies

```typescript
// Mock API calls
jest.mock('@/lib/api', () => ({
  api: {
    getTasks: jest.fn(),
  },
}));

// Mock next/router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));
```

### 5. Clean Up After Tests

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  cleanup();
});
```

## Next Steps

To complete Phase 9 testing:

1. **T077 (Integration Tests)**: Create integration test suite
2. **T078 (E2E Tests)**: Implement Playwright tests
3. **T079 (Accessibility)**: Run axe tests and manual checks
4. **T080 (Performance)**: Run Lighthouse CI and optimize
5. **T084 (Code Review)**: Review and refactor based on test findings

All test infrastructure is in place. Focus on writing the test suites outlined above.
