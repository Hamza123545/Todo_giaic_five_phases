# Data Model: Frontend Glass Morphism Redesign

**Feature**: 005-frontend-redesign
**Date**: 2025-12-15
**Status**: Complete

## Overview

This document defines the component interfaces, UI state structures, and data contracts for the glass morphism redesign. Since this is a visual redesign, there are no database model changes - only TypeScript interfaces for component props and UI state.

---

## Configuration Files

### 1. Navigation Configuration

**Purpose**: Centralized navigation items configuration

**File**: `frontend/lib/navigation.ts`

```typescript
import {
  LayoutDashboard,
  List,
  MessageCircle,
  Calendar,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string;
  disabled?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'tasks',
    label: 'Tasks',
    href: '/tasks',
    icon: List,
  },
  {
    id: 'chat',
    label: 'AI Chatbot',
    href: '/chat',
    icon: MessageCircle,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];
```

---

### 2. Brand Configuration

**Purpose**: Centralized brand identity configuration

**File**: `frontend/lib/brand.ts`

```typescript
import { HardHat } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const BRAND_CONFIG = {
  name: 'Todo Console',
  shortName: 'Console',
  logo: HardHat as LucideIcon,
  logoSize: 28, // w-7 h-7 in Tailwind
} as const;
```

---

### 3. Task Status Configuration

**Purpose**: Task status types and Kanban column mapping

**File**: `frontend/lib/task-status.ts`

```typescript
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export const TASK_STATUS_MAP: Record<TaskStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
} as const;

export const KANBAN_COLUMNS: TaskStatus[] = ['todo', 'in-progress', 'done'];

/**
 * Map task to Kanban column based on task status or completed flag
 */
export function getTaskColumn(task: { completed?: boolean; status?: TaskStatus }): TaskStatus {
  if (task.completed) return 'done';
  if (task.status === 'in-progress') return 'in-progress';
  return 'todo';
}
```

---

### 4. Dashboard Stats Data Structure

**Purpose**: Dashboard statistics data format

**File**: `frontend/lib/dashboard-stats.ts`

```typescript
export interface StatValue {
  value: number;
  change: number; // percentage change (positive or negative)
}

export interface DashboardStats {
  activeTasks: StatValue;
  completedTasks: StatValue;
  avgPriorityScore: StatValue;
}

// Example data:
export const mockDashboardStats: DashboardStats = {
  activeTasks: {
    value: 24780,
    change: 14.89,
  },
  completedTasks: {
    value: 17489,
    change: -2.45,
  },
  avgPriorityScore: {
    value: 9962,
    change: 0.92,
  },
};
```

---

### 5. Chart Data Structure

**Purpose**: Chart data format for Recharts integration

**File**: `frontend/lib/chart-data.ts`

```typescript
export interface ChartDataPoint {
  name: string; // Week name, date, etc.
  value: number; // Primary value
  secondary?: number; // Secondary value (for dual charts)
}

export interface ChartDataset {
  label: string;
  data: number[];
  color?: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

// Example data for bar chart:
export const mockBarChartData: ChartDataPoint[] = [
  { name: 'W1', value: 4000, secondary: 2400 },
  { name: 'W2', value: 3000, secondary: 1398 },
  { name: 'W3', value: 2000, secondary: 9800 },
  { name: 'W4', value: 2780, secondary: 3908 },
  { name: 'W5', value: 1890, secondary: 4800 },
  { name: 'W6', value: 2390, secondary: 3800 },
];

// Example data for line chart:
export const mockLineChartData: ChartDataPoint[] = [
  { name: 'W1', value: 4000 },
  { name: 'W2', value: 3000 },
  { name: 'W3', value: 2000 },
  { name: 'W4', value: 2780 },
  { name: 'W5', value: 1890 },
  { name: 'W6', value: 2390 },
];
```

---

### 6. Calendar Event Data Structure

**Purpose**: Calendar events data format

**File**: `frontend/lib/calendar.ts`

```typescript
export type CalendarEventType = 'meeting' | 'deadline' | 'milestone';

export interface CalendarEvent {
  id: string;
  date: Date | string;
  title: string;
  type?: CalendarEventType;
  color?: string;
}

export interface CalendarDay {
  date: number; // Day of month (1-31)
  isToday: boolean;
  events: CalendarEvent[];
}

// Example data:
export const mockCalendarEvents: CalendarEvent[] = [
  { id: '1', date: new Date(2025, 11, 5), title: 'Meeting', type: 'meeting' },
  { id: '2', date: new Date(2025, 11, 12), title: 'Meeting', type: 'meeting' },
  { id: '3', date: new Date(2025, 11, 19), title: 'Deadline', type: 'deadline' },
  { id: '4', date: new Date(2025, 11, 26), title: 'Meeting', type: 'meeting' },
];
```

---

### 7. Settings Form Data Structure

**Purpose**: Settings page form data formats

**File**: `frontend/lib/settings.ts`

```typescript
export interface ProfileFormData {
  fullName: string;
  email: string;
  jobTitle: string;
}

export interface NotificationPreferences {
  emailAlerts: boolean;
  inAppNotifications: boolean;
}

export interface SecurityFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
```

---

## Component Interfaces

### 1. GlassCard Component

**Purpose**: Base reusable component for all glass morphism cards

**TypeScript Interface**:
```typescript
// components/atoms/GlassCard.tsx
export interface GlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'flat'
  hover?: boolean
  onClick?: () => void
}

export type GlassCardVariant = 'default' | 'elevated' | 'flat'

// Internal style mapping
const variantStyles: Record<GlassCardVariant, string> = {
  default: 'bg-white/10 border-white/30 dark:bg-gray-800/10 dark:border-gray-700/50',
  elevated: 'bg-white/20 border-white/40 dark:bg-gray-800/20 dark:border-gray-700/60 shadow-2xl',
  flat: 'bg-white/5 border-white/20 dark:bg-gray-800/5 dark:border-gray-700/40'
}
```

**Usage Example**:
```typescript
<GlassCard variant="elevated" hover className="p-6">
  <h2>Card Title</h2>
  <p>Card content</p>
</GlassCard>
```

---

### 2. Sidebar Component

**Purpose**: Desktop fixed sidebar navigation with collapse functionality

**TypeScript Interface**:
```typescript
// components/organisms/Sidebar.tsx
export interface SidebarProps {
  items: NavigationItem[]
  isCollapsed?: boolean
  onCollapseToggle?: (collapsed: boolean) => void
  activeItem?: string
}

export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  badge?: number | string
}

// State management
export interface SidebarState {
  isCollapsed: boolean
  activeItem: string | null
  hoverItem: string | null
}
```

**Usage Example**:
```typescript
const navItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', href: '/tasks', icon: List, badge: 5 },
  { id: 'chat', label: 'AI Chatbot', href: '/chat', icon: MessageCircle },
]

<Sidebar items={navItems} isCollapsed={false} activeItem="dashboard" />
```

---

### 3. TopBar Component

**Purpose**: Mobile/tablet responsive top navigation bar

**TypeScript Interface**:
```typescript
// components/organisms/TopBar.tsx
export interface TopBarProps {
  title?: string
  showMenuToggle?: boolean
  onMenuToggle?: () => void
  showThemeToggle?: boolean
}

// Mobile menu state
export interface MobileMenuState {
  isOpen: boolean
  activeItem: string | null
}
```

**Usage Example**:
```typescript
<TopBar
  title="Todo Console"
  showMenuToggle
  onMenuToggle={handleMenuToggle}
  showThemeToggle
/>
```

---

### 4. StatCard Component

**Purpose**: Dashboard statistic card with icon, value, and trend

**TypeScript Interface**:
```typescript
// components/molecules/StatCard.tsx
export interface StatCardProps {
  title: string
  value: number | string
  prefix?: string
  suffix?: string
  icon: LucideIcon
  iconColor?: string
  trend?: TrendData
  chart?: ChartData
  onClick?: () => void
}

export interface TrendData {
  value: number // percentage change
  direction: 'up' | 'down' | 'neutral'
  label?: string
}

export interface ChartData {
  values: number[]
  labels?: string[]
}
```

**Usage Example**:
```typescript
<StatCard
  title="Active Tasks"
  value={24}
  icon={List}
  iconColor="text-indigo-600"
  trend={{ value: 12, direction: 'up', label: 'vs last week' }}
  chart={{ values: [10, 15, 12, 18, 24] }}
/>
```

---

### 5. TaskCard Component

**Purpose**: Kanban task card for Tasks page

**TypeScript Interface**:
```typescript
// components/molecules/TaskCard.tsx
export interface TaskCardProps {
  task: TaskData
  onUpdate?: (taskId: string, updates: Partial<TaskData>) => void
  onDelete?: (taskId: string) => void
  onClick?: (taskId: string) => void
}

export interface TaskData {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  tags?: string[]
  dueDate?: Date
  completed: boolean
}

export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

// Priority color mapping
const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500'
}
```

**Usage Example**:
```typescript
const task: TaskData = {
  id: '1',
  title: 'Redesign landing page',
  priority: 'high',
  status: 'in_progress',
  tags: ['design', 'urgent'],
  completed: false
}

<TaskCard task={task} onUpdate={handleUpdate} onDelete={handleDelete} />
```

---

### 6. HeaderGreeting Component

**Purpose**: Welcome header with user greeting

**TypeScript Interface**:
```typescript
// components/molecules/HeaderGreeting.tsx
export interface HeaderGreetingProps {
  userName?: string
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}
```

**Usage Example**:
```typescript
<HeaderGreeting
  userName="John"
  title="Welcome back!"
  subtitle="Here's what's happening with your tasks today"
/>
```

---

### 7. ThemeToggle Component

**Purpose**: Dark mode toggle button

**TypeScript Interface**:
```typescript
// components/molecules/ThemeToggle.tsx
export interface ThemeToggleProps {
  variant?: 'icon' | 'switch'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}
```

**Usage Example**:
```typescript
<ThemeToggle variant="icon" size="md" showLabel={false} />
```

---

### 8. ChartCard Component

**Purpose**: Dashboard chart container with glass morphism

**TypeScript Interface**:
```typescript
// components/molecules/ChartCard.tsx
export interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode // Recharts component
  actions?: React.ReactNode
  loading?: boolean
}
```

**Usage Example**:
```typescript
<ChartCard title="Task Completion Trends" subtitle="Last 7 days">
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      {/* Chart configuration */}
    </LineChart>
  </ResponsiveContainer>
</ChartCard>
```

---

### 9. KanbanColumn Component

**Purpose**: Kanban column container for task cards

**TypeScript Interface**:
```typescript
// components/organisms/KanbanColumn.tsx
export interface KanbanColumnProps {
  title: string
  status: TaskStatus
  tasks: TaskData[]
  count?: number
  onAddTask?: () => void
  onTaskUpdate?: (taskId: string, updates: Partial<TaskData>) => void
  onTaskDelete?: (taskId: string) => void
}
```

**Usage Example**:
```typescript
<KanbanColumn
  title="To Do"
  status="todo"
  tasks={todoTasks}
  count={todoTasks.length}
  onAddTask={handleAddTask}
  onTaskUpdate={handleTaskUpdate}
/>
```

---

## UI State Structures

### 1. Layout State

**Purpose**: Manage sidebar and mobile menu state

```typescript
// hooks/useLayoutState.ts
export interface LayoutState {
  sidebarCollapsed: boolean
  mobileMenuOpen: boolean
  activeRoute: string
}

export interface LayoutActions {
  toggleSidebar: () => void
  toggleMobileMenu: () => void
  setActiveRoute: (route: string) => void
  collapseSidebar: (collapsed: boolean) => void
  closeMobileMenu: () => void
}

// Hook return type
export interface UseLayoutState {
  state: LayoutState
  actions: LayoutActions
}
```

**Usage**:
```typescript
const { state, actions } = useLayoutState()

// Toggle sidebar
actions.toggleSidebar()

// Check if collapsed
if (state.sidebarCollapsed) { /* ... */ }
```

---

### 2. Theme State

**Purpose**: Manage dark mode theme (provided by next-themes)

```typescript
// Using next-themes (no custom interface needed)
import { useTheme } from 'next-themes'

export interface ThemeState {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  resolvedTheme: 'light' | 'dark'
  systemTheme: 'light' | 'dark'
}
```

**Usage**:
```typescript
const { theme, setTheme, resolvedTheme } = useTheme()

// Toggle theme
setTheme(theme === 'dark' ? 'light' : 'dark')

// Get effective theme
const effectiveTheme = resolvedTheme // 'light' or 'dark'
```

---

### 3. Dashboard State

**Purpose**: Manage dashboard data and loading states

```typescript
// app/dashboard/types.ts
export interface DashboardData {
  stats: DashboardStats
  chartData: ChartDatasets
  recentActivity: ActivityItem[]
  taskSummary: TaskSummary
}

export interface DashboardStats {
  activeTasks: number
  completedTasks: number
  priorityScore: number
}

export interface ChartDatasets {
  weeklyCompletion: ChartDataPoint[]
  tasksByPriority: ChartDataPoint[]
}

export interface ChartDataPoint {
  label: string
  value: number
  date?: string
}

export interface ActivityItem {
  id: string
  type: 'created' | 'completed' | 'updated' | 'deleted'
  description: string
  timestamp: Date
}

export interface TaskSummary {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
}
```

---

### 4. Tasks Page State

**Purpose**: Manage Kanban board and task filtering

```typescript
// app/tasks/types.ts
export interface TasksPageState {
  tasks: TaskData[]
  filter: TaskFilter
  view: TaskView
  selectedTasks: string[]
}

export interface TaskFilter {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  tags?: string[]
  search?: string
}

export type TaskView = 'kanban' | 'list' | 'grid'

export interface TasksPageActions {
  setFilter: (filter: Partial<TaskFilter>) => void
  setView: (view: TaskView) => void
  selectTask: (taskId: string) => void
  deselectTask: (taskId: string) => void
  selectAll: () => void
  deselectAll: () => void
}
```

---

## Component Hierarchy

```
App
├── RootLayout
│   ├── ThemeProvider
│   ├── BackgroundBlobs
│   ├── Sidebar (desktop only, lg:block)
│   ├── TopBar (mobile/tablet only, lg:hidden)
│   └── Main Content Area
│
├── Dashboard Page
│   ├── HeaderGreeting
│   ├── Stats Grid
│   │   ├── StatCard (Active Tasks)
│   │   ├── StatCard (Completed)
│   │   └── StatCard (Priority Score)
│   ├── Charts Section
│   │   ├── ChartCard (Bar Chart)
│   │   └── ChartCard (Line Chart)
│   └── Split Layout
│       ├── ActivityLog (2/3 width)
│       └── TaskListCard (1/3 width)
│
├── Tasks Page
│   ├── HeaderGreeting
│   ├── Task Filters
│   └── Kanban Board
│       ├── KanbanColumn (To Do)
│       ├── KanbanColumn (In Progress)
│       └── KanbanColumn (Done)
│
├── Chat Page
│   ├── HeaderGreeting
│   └── ChatWidget (OpenAI ChatKit)
│
└── Settings Page
    ├── HeaderGreeting
    └── Settings Tabs
        ├── Profile Tab
        ├── Notifications Tab
        └── Security Tab
```

---

## Validation Rules

### 1. Component Props Validation

All components use TypeScript for compile-time validation. No runtime validation needed for UI components.

### 2. Theme Validation

```typescript
// Valid theme values
const validThemes = ['light', 'dark', 'system'] as const
type Theme = typeof validThemes[number]
```

### 3. Task Data Validation

```typescript
// Priority validation
const validPriorities = ['low', 'medium', 'high'] as const
type TaskPriority = typeof validPriorities[number]

// Status validation
const validStatuses = ['todo', 'in_progress', 'done'] as const
type TaskStatus = typeof validStatuses[number]
```

---

## State Persistence

### 1. Theme State
- **Storage**: localStorage (via next-themes)
- **Key**: 'theme'
- **Values**: 'light' | 'dark' | 'system'

### 2. Sidebar Collapsed State
- **Storage**: localStorage
- **Key**: 'sidebar-collapsed'
- **Values**: 'true' | 'false'

### 3. Task View Preference
- **Storage**: localStorage
- **Key**: 'task-view'
- **Values**: 'kanban' | 'list' | 'grid'

---

## API Integration Interfaces

### 1. Task API Response

```typescript
// Existing API response (no changes)
export interface TaskAPIResponse {
  id: string
  user_id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  tags: string[]
  completed: boolean
  created_at: string
  updated_at: string
}

// Transform to frontend TaskData
export function transformTaskResponse(apiTask: TaskAPIResponse): TaskData {
  return {
    id: apiTask.id,
    title: apiTask.title,
    description: apiTask.description,
    priority: apiTask.priority,
    status: apiTask.completed ? 'done' : 'todo',
    tags: apiTask.tags,
    dueDate: apiTask.due_date ? new Date(apiTask.due_date) : undefined,
    completed: apiTask.completed
  }
}
```

---

## CSS Custom Properties

### 1. Glass Morphism Variables

```css
/* tailwind.config.js - extend theme */
{
  theme: {
    extend: {
      colors: {
        'glass-light': 'rgba(255, 255, 255, 0.1)',
        'glass-dark': 'rgba(31, 41, 55, 0.1)',
        'glass-border-light': 'rgba(255, 255, 255, 0.3)',
        'glass-border-dark': 'rgba(75, 85, 99, 0.5)',
      },
      backdropBlur: {
        'glass': '24px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(99, 102, 241, 0.1)',
      }
    }
  }
}
```

---

## Export Summary

**Component Interfaces**: 9 defined (GlassCard, Sidebar, TopBar, StatCard, TaskCard, HeaderGreeting, ThemeToggle, ChartCard, KanbanColumn)

**State Structures**: 4 defined (LayoutState, ThemeState, DashboardState, TasksPageState)

**Configuration Files**: 7 defined (navigation.ts, brand.ts, task-status.ts, dashboard-stats.ts, chart-data.ts, calendar.ts, settings.ts)

**Data Transformations**: 1 defined (TaskAPIResponse → TaskData)

**No Database Changes**: This is a UI-only redesign

---

**Status**: ✅ Complete
**Ready for**: Phase 2 Tasks Generation
