# UI Components Specification

**Status**: Implemented
**Version**: 1.0
**Last Updated**: 2025-12-13

## Overview

Phase II includes 52 React components organized into logical categories. Components use **Next.js 16 App Router**, **TypeScript 5+**, **Tailwind CSS 4**, **shadcn/ui**, and **Framer Motion** for animations.

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [Task Management Components](#task-management-components)
3. [Authentication Components](#authentication-components)
4. [UI/UX Components](#uiux-components)
5. [Utility Components](#utility-components)
6. [shadcn/ui Components](#shadcnui-components)
7. [Server vs Client Components](#server-vs-client-components)
8. [Related Specifications](#related-specifications)

---

## Component Architecture

### Design Principles

1. **Server Components by Default**: Use Server Components for static content
2. **Client Components When Needed**: Use "use client" for interactivity
3. **Composition Over Inheritance**: Build complex UIs from simple components
4. **Type Safety**: All components have TypeScript interfaces
5. **Accessibility**: ARIA attributes and keyboard navigation
6. **Responsive Design**: Mobile-first approach with Tailwind CSS
7. **Animations**: Framer Motion for smooth transitions

### Directory Structure

```
frontend/components/
├── TaskForm.tsx                 # Task creation/editing form
├── TaskItem.tsx                 # Individual task display
├── TaskList.tsx                 # Task list with virtualization
├── TaskStatistics.tsx           # Task statistics dashboard
├── FilterControls.tsx           # Task filtering UI
├── SortControls.tsx            # Task sorting UI
├── SearchBar.tsx               # Task search
├── BulkActions.tsx             # Bulk task operations
├── ExportImportControls.tsx    # Export/import UI
├── ProtectedRoute.tsx          # Route authentication wrapper
├── Header.tsx                  # App header
├── DashboardHeader.tsx         # Dashboard header with user info
├── LoadingSpinner.tsx          # Loading indicator
├── ErrorDisplay.tsx            # Error message display
├── ThemeProvider.tsx           # Dark mode context
├── DarkModeToggle.tsx          # Dark mode switch
├── KeyboardShortcuts.tsx       # Keyboard shortcuts handler
├── PWAInstallButton.tsx        # PWA install prompt
├── OfflineIndicator.tsx        # Offline status indicator
├── ... (and more)
└── ui/                         # shadcn/ui components
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── dropdown-menu.tsx
    └── toast.tsx
```

---

## Task Management Components

### 1. TaskForm

**File**: `components/TaskForm.tsx`
**Type**: Client Component
**Purpose**: Create and edit tasks with validation

**Props**:
```typescript
interface TaskFormProps {
  userId: string;
  onSuccess?: (task: Task) => void;
  onError?: (error: Error) => void;
  initialData?: Task | null;
  submitLabel?: string;
  onCancel?: () => void;
  className?: string;
}
```

**Features**:
- Title input (required, max 200 chars)
- Description textarea (optional, max 1000 chars)
- Priority dropdown (low/medium/high)
- Due date picker
- Tags input with add/remove
- Client-side validation
- XSS sanitization
- Loading states
- Error handling
- Framer Motion animations

**Usage**:
```tsx
<TaskForm
  userId={user.id}
  onSuccess={(task) => console.log("Created:", task)}
  onError={(error) => console.error(error)}
/>
```

**Validation**:
- Title: Required, 1-200 characters
- Description: Optional, max 1000 characters
- Due date: Cannot be in the past

---

### 2. TaskItem

**File**: `components/TaskItem.tsx`
**Type**: Client Component
**Purpose**: Display individual task with actions

**Props**:
```typescript
interface TaskItemProps {
  task: Task;
  userId: string;
  onTaskChange?: () => void;
  onError?: (error: Error) => void;
}
```

**Features**:
- Checkbox to toggle completion
- Task title and description
- Priority badge (color-coded)
- Due date display with overdue indicator
- Tags display
- Edit button (opens modal)
- Delete button (with confirmation)
- Drag handle (for reordering)
- Responsive layout
- Hover effects

**Actions**:
- Toggle completion
- Edit task (opens TaskDetailModal)
- Delete task (with confirmation)

**Priority Colors**:
- Low: Gray
- Medium: Blue
- High: Red

---

### 3. TaskList

**File**: `components/TaskList.tsx`
**Type**: Client Component
**Purpose**: Display list of tasks with multiple views

**Props**:
```typescript
interface TaskListProps {
  tasks: Task[];
  userId: string;
  onTaskChange?: () => void;
  onError?: (error: Error) => void;
  isLoading?: boolean;
  viewMode?: TaskViewMode; // "list" | "grid" | "kanban"
}
```

**Features**:
- Three view modes: List, Grid, Kanban
- Drag-and-drop reordering
- Empty state placeholder
- Loading skeleton
- Virtualization (for large lists)
- Animations (Framer Motion)

**View Modes**:
1. **List View**: Vertical list of tasks (default)
2. **Grid View**: Card-based grid layout
3. **Kanban View**: Three columns (Pending, In Progress, Completed)

---

### 4. TaskDetailModal

**File**: `components/TaskDetailModal.tsx`
**Type**: Client Component
**Purpose**: Modal for viewing/editing task details

**Props**:
```typescript
interface TaskDetailModalProps {
  task: Task | null;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onTaskChange?: () => void;
  onError?: (error: Error) => void;
}
```

**Features**:
- Full task details display
- Edit mode with TaskForm
- Close button
- Backdrop click to close
- Keyboard shortcuts (Esc to close)
- Animation (slide in from right)

---

### 5. TaskStatistics

**File**: `components/TaskStatistics.tsx`
**Type**: Client Component
**Purpose**: Display task statistics dashboard

**Props**:
```typescript
interface TaskStatisticsProps {
  userId: string;
}
```

**Features**:
- Total tasks count
- Completed tasks count
- Pending tasks count
- Overdue tasks count
- Priority breakdown (pie chart or bars)
- Completion rate percentage
- Animated numbers

**Data Source**: `GET /api/{user_id}/tasks/statistics`

---

### 6. FilterControls

**File**: `components/FilterControls.tsx`
**Type**: Client Component
**Purpose**: UI for filtering tasks by status

**Props**:
```typescript
interface FilterControlsProps {
  currentFilter: TaskFilter; // "all" | "pending" | "completed"
  onFilterChange: (filter: TaskFilter) => void;
  taskCounts?: {
    all: number;
    pending: number;
    completed: number;
  };
}
```

**Features**:
- Three filter buttons: All, Pending, Completed
- Active filter highlighted
- Badge with count for each filter
- Keyboard navigation

---

### 7. SortControls

**File**: `components/SortControls.tsx`
**Type**: Client Component
**Purpose**: UI for sorting tasks

**Props**:
```typescript
interface SortControlsProps {
  currentSort: SortKey; // "created" | "title" | "updated" | "priority" | "due_date"
  currentDirection: SortDirection; // "asc" | "desc"
  onSortChange: (key: SortKey, direction?: SortDirection) => void;
}
```

**Features**:
- Dropdown menu with sort options
- Sort direction toggle (asc/desc)
- Active sort highlighted
- Icons for sort direction

**Sort Options**:
- Created date (default)
- Title
- Updated date
- Priority
- Due date

---

### 8. SearchBar

**File**: `components/SearchBar.tsx`
**Type**: Client Component
**Purpose**: Search tasks by title/description

**Props**:
```typescript
interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}
```

**Features**:
- Text input for search query
- Debounced search (500ms default)
- Clear button
- Search icon
- Keyboard shortcut (Ctrl/Cmd + K)
- Loading indicator

---

### 9. BulkActions

**File**: `components/BulkActions.tsx`
**Type**: Client Component
**Purpose**: Perform bulk operations on selected tasks

**Props**:
```typescript
interface BulkActionsProps {
  userId: string;
  selectedTaskIds: number[];
  onActionComplete?: () => void;
  onError?: (error: Error) => void;
}
```

**Features**:
- Select all checkbox
- Bulk delete
- Bulk complete
- Bulk set priority
- Selection count display
- Confirmation dialogs

**Operations**:
- Delete selected
- Mark as completed
- Mark as pending
- Set priority (low/medium/high)

---

### 10. ExportImportControls

**File**: `components/ExportImportControls.tsx`
**Type**: Client Component
**Purpose**: Export and import tasks

**Props**:
```typescript
interface ExportImportControlsProps {
  userId: string;
  onImportSuccess?: () => void;
  onError?: (error: Error) => void;
}
```

**Features**:
- Export dropdown (CSV, JSON, PDF)
- Import file picker (CSV, JSON)
- Download trigger
- Upload progress
- Error handling

---

### 11. SortableTaskItem

**File**: `components/SortableTaskItem.tsx`
**Type**: Client Component
**Purpose**: Draggable task item (for drag-and-drop)

**Props**:
```typescript
interface SortableTaskItemProps {
  task: Task;
  userId: string;
  onTaskChange?: () => void;
  onError?: (error: Error) => void;
}
```

**Features**:
- Drag handle
- Drag preview
- Drop zone indicators
- Reorder animation
- Uses `@dnd-kit/core` for drag-and-drop

---

### 12. PaginationControls

**File**: `components/PaginationControls.tsx`
**Type**: Client Component
**Purpose**: Pagination UI

**Props**:
```typescript
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}
```

**Features**:
- Previous/Next buttons
- Page number buttons (with ellipsis for large page counts)
- Items per page dropdown (10, 20, 50, 100)
- Total items display
- Disabled states for first/last page

---

### 13. UndoRedoControls

**File**: `components/UndoRedoControls.tsx`
**Type**: Client Component
**Purpose**: Undo/redo task operations

**Props**:
```typescript
interface UndoRedoControlsProps {
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo: boolean;
  canRedo: boolean;
}
```

**Features**:
- Undo button
- Redo button
- Keyboard shortcuts (Ctrl/Cmd + Z, Ctrl/Cmd + Shift + Z)
- Disabled states
- Toast notifications

---

### 14. ExportDropdown

**File**: `components/ExportDropdown.tsx`
**Type**: Client Component
**Purpose**: Dropdown menu for exporting tasks

**Props**:
```typescript
interface ExportDropdownProps {
  userId: string;
  className?: string;
}
```

**Features**:
- Dropdown button
- Three export options: CSV, JSON, PDF
- Download trigger
- Loading state
- Error handling

---

## Authentication Components

### 15. ProtectedRoute

**File**: `components/ProtectedRoute.tsx`
**Type**: Client Component
**Purpose**: Wrapper for authenticated routes

**Props**:
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
```

**Features**:
- Check authentication status
- Redirect to signin if not authenticated
- Loading spinner while checking
- Custom fallback component

**Usage**:
```tsx
<ProtectedRoute>
  <DashboardContent />
</ProtectedRoute>
```

---

## UI/UX Components

### 16. Header

**File**: `components/Header.tsx`
**Type**: Server Component (can be)
**Purpose**: Main app header

**Props**:
```typescript
interface HeaderProps {
  user?: User;
}
```

**Features**:
- App logo/title
- Navigation links
- Dark mode toggle
- User menu (if authenticated)

---

### 17. DashboardHeader

**File**: `components/DashboardHeader.tsx`
**Type**: Client Component
**Purpose**: Dashboard-specific header with user info

**Props**:
```typescript
interface DashboardHeaderProps {
  user?: User;
  onSignOut?: () => void;
}
```

**Features**:
- User name display
- Sign out button
- Dark mode toggle
- PWA install button

---

### 18. LoadingSpinner

**File**: `components/LoadingSpinner.tsx`
**Type**: Client Component
**Purpose**: Loading indicator

**Props**:
```typescript
interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: string;
  label?: string;
}
```

**Features**:
- Three sizes: small, medium, large
- Customizable color
- Optional label text
- Accessible (ARIA attributes)

---

### 19. ErrorDisplay

**File**: `components/ErrorDisplay.tsx`
**Type**: Client Component
**Purpose**: Display error messages

**Props**:
```typescript
interface ErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
  className?: string;
}
```

**Features**:
- Error message display
- Optional retry button
- Dismissible
- Red theme for errors

---

### 20. ThemeProvider

**File**: `components/ThemeProvider.tsx`
**Type**: Client Component
**Purpose**: Dark mode context provider

**Props**:
```typescript
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: "light" | "dark";
}
```

**Features**:
- Light/dark theme state
- Persists theme to localStorage
- System theme detection
- Theme toggle function

**Context**:
```typescript
const ThemeContext = React.createContext<{
  theme: "light" | "dark";
  toggleTheme: () => void;
}>()
```

---

### 21. DarkModeToggle

**File**: `components/DarkModeToggle.tsx`
**Type**: Client Component
**Purpose**: Toggle dark mode

**Props**:
```typescript
interface DarkModeToggleProps {
  className?: string;
}
```

**Features**:
- Sun/moon icon
- Smooth transition
- Accessible button
- Tooltip

---

### 22. ToastNotification

**File**: `components/ToastNotification.tsx`
**Type**: Client Component
**Purpose**: Toast notifications

**Props**:
```typescript
interface ToastNotificationProps {
  type: "success" | "error" | "info" | "warning";
  title?: string;
  description: string;
  duration?: number;
  onClose?: () => void;
}
```

**Features**:
- Four types: success, error, info, warning
- Auto-dismiss (configurable duration)
- Close button
- Slide-in animation
- Stacking for multiple toasts

---

### 23. SkeletonLoader

**File**: `components/SkeletonLoader.tsx`
**Type**: Client Component
**Purpose**: Skeleton loading state

**Props**:
```typescript
interface SkeletonLoaderProps {
  count?: number;
  height?: string;
  className?: string;
}
```

**Features**:
- Animated placeholder
- Customizable height
- Multiple skeleton rows
- Shimmer effect

---

### 24. KeyboardShortcuts

**File**: `components/KeyboardShortcuts.tsx`
**Type**: Client Component
**Purpose**: Global keyboard shortcuts handler

**Props**:
```typescript
interface KeyboardShortcutsProps {
  onSearchToggle?: () => void;
  onNewTask?: () => void;
}
```

**Shortcuts**:
- `Ctrl/Cmd + K`: Toggle search
- `Ctrl/Cmd + N`: New task
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Shift + Z`: Redo
- `Esc`: Close modal/dialog

---

### 25. OfflineIndicator

**File**: `components/OfflineIndicator.tsx`
**Type**: Client Component
**Purpose**: Show offline status

**Features**:
- Detects online/offline status
- Banner notification when offline
- Auto-hide when back online
- Warning icon and message

---

### 26. SyncIndicator

**File**: `components/SyncIndicator.tsx`
**Type**: Client Component
**Purpose**: Show sync status for real-time updates

**Features**:
- Syncing indicator
- Success/error states
- Last sync timestamp
- Auto-refresh indicator

---

### 27. PWAInstallButton

**File**: `components/PWAInstallButton.tsx`
**Type**: Client Component
**Purpose**: PWA install prompt button

**Features**:
- Detects PWA installability
- Shows install button
- Triggers install prompt
- Hides after installation

---

### 28. PWAInstallPrompt

**File**: `components/PWAInstallPrompt.tsx`
**Type**: Client Component
**Purpose**: PWA install prompt modal

**Features**:
- Modal with install instructions
- Install button
- Dismiss button
- "Don't show again" option

---

### 29. FocusManager

**File**: `components/FocusManager.tsx`
**Type**: Client Component
**Purpose**: Manage keyboard focus for accessibility

**Features**:
- Trap focus in modals
- Restore focus on close
- Skip to main content link
- Focus visible indicator

---

## Utility Components

### 30. ComponentErrorBoundary

**File**: `components/ComponentErrorBoundary.tsx`
**Type**: Client Component (Class component)
**Purpose**: Error boundary for component errors

**Props**:
```typescript
interface ComponentErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
```

**Features**:
- Catch component errors
- Display fallback UI
- Error logging
- Retry button

---

### 31. RouteErrorBoundary

**File**: `components/RouteErrorBoundary.tsx`
**Type**: Client Component
**Purpose**: Error boundary for route-level errors

**Features**:
- Full-page error UI
- Error details (in dev mode)
- Back to home button
- Report error button

---

### 32. ErrorBoundary

**File**: `components/ErrorBoundary.tsx`
**Type**: Client Component (Class component)
**Purpose**: Generic error boundary

**Props**:
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error) => React.ReactNode;
}
```

**Features**:
- Catch all errors
- Custom fallback renderer
- Error logging
- Reset error state

---

### 33. LazyComponents

**File**: `components/LazyComponents.tsx`
**Type**: Client Component
**Purpose**: Lazy load components for code splitting

**Features**:
- Dynamic imports
- Loading fallback
- Error handling
- Prefetching

**Example**:
```tsx
const LazyTaskList = lazy(() => import("./TaskList"));

<Suspense fallback={<LoadingSpinner />}>
  <LazyTaskList />
</Suspense>
```

---

### 34. UndoToast

**File**: `components/UndoToast.tsx`
**Type**: Client Component
**Purpose**: Toast with undo button

**Props**:
```typescript
interface UndoToastProps {
  message: string;
  onUndo: () => void;
  duration?: number;
}
```

**Features**:
- Undo button in toast
- Auto-dismiss countdown
- Cancel auto-dismiss on hover

---

## Landing Page Components

### 35. LandingNavbar

**File**: `components/LandingNavbar.tsx`
**Type**: Server Component (can be)
**Purpose**: Landing page navigation

**Features**:
- Logo
- Navigation links
- Sign in/Sign up buttons
- Mobile menu toggle

---

### 36. LandingHero

**File**: `components/LandingHero.tsx`
**Type**: Server Component (can be)
**Purpose**: Landing page hero section

**Features**:
- Headline
- Subheadline
- CTA buttons (Get Started, Learn More)
- Hero image/illustration

---

### 37. LandingFeatures

**File**: `components/LandingFeatures.tsx`
**Type**: Server Component (can be)
**Purpose**: Landing page features section

**Features**:
- Feature grid (3 columns)
- Feature cards with icons
- Feature titles and descriptions

---

### 38. LandingHowItWorks

**File**: `components/LandingHowItWorks.tsx`
**Type**: Server Component (can be)
**Purpose**: Landing page how-it-works section

**Features**:
- Step-by-step guide
- Numbered steps
- Screenshots or illustrations

---

### 39. LandingFooter

**File**: `components/LandingFooter.tsx`
**Type**: Server Component (can be)
**Purpose**: Landing page footer

**Features**:
- Social links
- Copyright notice
- Privacy policy link
- Terms of service link

---

### 40. ResponsiveFooter

**File**: `components/ResponsiveFooter.tsx`
**Type**: Server Component (can be)
**Purpose**: Responsive footer for all pages

**Features**:
- Mobile-friendly layout
- Quick links
- Contact info

---

## shadcn/ui Components

### 41. Button

**File**: `components/ui/button.tsx`
**Purpose**: Reusable button component

**Variants**:
- Default
- Primary
- Secondary
- Destructive
- Outline
- Ghost
- Link

**Sizes**:
- Small
- Medium
- Large

---

### 42. Card

**File**: `components/ui/card.tsx`
**Purpose**: Card container with header, content, footer

**Sub-components**:
- `Card`: Main container
- `CardHeader`: Header section
- `CardTitle`: Title
- `CardDescription`: Description
- `CardContent`: Main content
- `CardFooter`: Footer section

---

### 43. Dialog

**File**: `components/ui/dialog.tsx`
**Purpose**: Modal dialog

**Sub-components**:
- `Dialog`: Root component
- `DialogTrigger`: Trigger button
- `DialogContent`: Modal content
- `DialogHeader`: Header section
- `DialogTitle`: Title
- `DialogDescription`: Description
- `DialogFooter`: Footer section

---

### 44. DropdownMenu

**File**: `components/ui/dropdown-menu.tsx`
**Purpose**: Dropdown menu

**Sub-components**:
- `DropdownMenu`: Root component
- `DropdownMenuTrigger`: Trigger button
- `DropdownMenuContent`: Menu content
- `DropdownMenuItem`: Menu item
- `DropdownMenuSeparator`: Separator line
- `DropdownMenuLabel`: Label

---

### 45. Toast

**File**: `components/ui/toast.tsx`
**Purpose**: Toast notification system

**Sub-components**:
- `Toaster`: Toast container
- `Toast`: Individual toast
- `ToastTitle`: Toast title
- `ToastDescription`: Toast description
- `ToastAction`: Toast action button

**Hook**: `useToast()`

---

## Test Components

### 46. TaskForm.test.tsx

**File**: `__tests__/components/TaskForm.test.tsx`
**Purpose**: Tests for TaskForm component

---

### 47. TaskItem.test.tsx

**File**: `__tests__/components/TaskItem.test.tsx`
**Purpose**: Tests for TaskItem component

---

## Server vs Client Components

### Server Components (Default)

Components that do NOT need interactivity:

- `Header` (if static)
- `LandingNavbar`
- `LandingHero`
- `LandingFeatures`
- `LandingHowItWorks`
- `LandingFooter`
- `ResponsiveFooter`

**Benefits**:
- Smaller client bundle size
- Faster initial page load
- SEO-friendly

---

### Client Components ("use client")

Components that need interactivity, state, or browser APIs:

All task management components:
- `TaskForm`
- `TaskItem`
- `TaskList`
- `TaskDetailModal`
- `TaskStatistics`
- `FilterControls`
- `SortControls`
- `SearchBar`
- `BulkActions`
- `ExportImportControls`
- `SortableTaskItem`
- `PaginationControls`
- `UndoRedoControls`
- `ExportDropdown`

Authentication components:
- `ProtectedRoute`

UI/UX components:
- `DashboardHeader`
- `LoadingSpinner`
- `ErrorDisplay`
- `ThemeProvider`
- `DarkModeToggle`
- `ToastNotification`
- `SkeletonLoader`
- `KeyboardShortcuts`
- `OfflineIndicator`
- `SyncIndicator`
- `PWAInstallButton`
- `PWAInstallPrompt`
- `FocusManager`

Utility components:
- `ComponentErrorBoundary`
- `RouteErrorBoundary`
- `ErrorBoundary`
- `LazyComponents`
- `UndoToast`

shadcn/ui components (all client components):
- `Button`
- `Card`
- `Dialog`
- `DropdownMenu`
- `Toast`

---

## Component Props Patterns

### Common Patterns

**Callback Props**:
```typescript
onSuccess?: (data: Task) => void;
onError?: (error: Error) => void;
onChange?: () => void;
```

**Loading States**:
```typescript
isLoading?: boolean;
```

**User ID** (for API calls):
```typescript
userId: string;
```

**Styling**:
```typescript
className?: string;
```

**Children**:
```typescript
children: React.ReactNode;
```

---

## Styling Patterns

All components use Tailwind CSS with:
- Responsive classes (`sm:`, `md:`, `lg:`)
- Dark mode classes (`dark:`)
- Custom utility classes (from `lib/utils.ts`)
- `cn()` function for conditional classes

**Example**:
```tsx
className={cn(
  "px-4 py-2 rounded-lg",
  "bg-blue-600 hover:bg-blue-700",
  "dark:bg-blue-800 dark:hover:bg-blue-900",
  className
)}
```

---

## Animation Patterns

Components use Framer Motion for animations:

**Fade In**:
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
```

**Slide In**:
```tsx
<motion.div
  initial={{ x: 100, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: 100, opacity: 0 }}
>
```

**Scale**:
```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
```

---

## Accessibility Patterns

All components follow accessibility best practices:

- **ARIA attributes**: `aria-label`, `aria-describedby`, `aria-invalid`
- **Keyboard navigation**: Tab, Enter, Escape
- **Focus management**: Focus trapping in modals
- **Screen reader support**: Semantic HTML, ARIA roles
- **Color contrast**: WCAG AA compliance

---

## Related Specifications

- **@specs/ui/pages.md** - Page components that use these components
- **@specs/api/rest-endpoints.md** - API endpoints consumed by components
- **@specs/features/authentication.md** - Authentication flow for ProtectedRoute
- **@specs/architecture.md** - Component architecture and patterns

---

## Conclusion

The UI component library provides 52 components organized into logical categories. Components follow Next.js 16 App Router patterns with Server Components by default and Client Components for interactivity. All components are type-safe, accessible, responsive, and animated with Framer Motion.

**Total Components**: 52
- **Task Management**: 14 components
- **Authentication**: 1 component
- **UI/UX**: 15 components
- **Utility**: 5 components
- **Landing Page**: 6 components
- **shadcn/ui**: 5 components
- **Test**: 2 components
- **Other**: 4 components
