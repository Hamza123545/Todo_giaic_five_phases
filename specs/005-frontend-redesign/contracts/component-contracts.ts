/**
 * Component Contracts: Frontend Glass Morphism Redesign
 *
 * Feature: 005-frontend-redesign
 * Date: 2025-12-15
 *
 * This file contains TypeScript interfaces and types for all components
 * in the glass morphism redesign. These contracts serve as the API
 * between components and ensure type safety across the application.
 */

import { LucideIcon } from 'lucide-react'

// ============================================================================
// ATOMS - Base Components
// ============================================================================

/**
 * GlassCard - Base glass morphism card component
 * Used as foundation for all glass morphism UI elements
 */
export interface GlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'flat'
  hover?: boolean
  onClick?: () => void
}

export type GlassCardVariant = 'default' | 'elevated' | 'flat'

/**
 * Button - Glass morphism button component
 */
export interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: LucideIcon
  onClick?: () => void
  className?: string
}

/**
 * BackgroundBlobs - Animated gradient background
 */
export interface BackgroundBlobsProps {
  count?: number
  colors?: string[]
  blur?: 'sm' | 'md' | 'lg' | 'xl'
}

// ============================================================================
// MOLECULES - Composed Components
// ============================================================================

/**
 * StatCard - Dashboard statistic card with icon, value, and trend
 */
export interface StatCardProps {
  title: string
  value: number | string
  prefix?: string
  suffix?: string
  icon: LucideIcon
  iconColor?: string
  trend?: TrendData
  chart?: ChartData
  loading?: boolean
  onClick?: () => void
}

export interface TrendData {
  value: number // percentage change
  direction: 'up' | 'down' | 'neutral'
  label?: string
  period?: string // e.g., "vs last week"
}

export interface ChartData {
  values: number[]
  labels?: string[]
}

/**
 * TaskCard - Kanban task card for Tasks page
 */
export interface TaskCardProps {
  task: TaskData
  onUpdate?: (taskId: string, updates: Partial<TaskData>) => void
  onDelete?: (taskId: string) => void
  onClick?: (taskId: string) => void
  draggable?: boolean
}

export interface TaskData {
  id: string
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  tags?: string[]
  dueDate?: Date
  completed: boolean
  createdAt?: Date
  updatedAt?: Date
}

export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

/**
 * HeaderGreeting - Welcome header with user greeting
 */
export interface HeaderGreetingProps {
  userName?: string
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  loading?: boolean
}

/**
 * ThemeToggle - Dark mode toggle button
 */
export interface ThemeToggleProps {
  variant?: 'icon' | 'switch'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

/**
 * ChartCard - Dashboard chart container with glass morphism
 */
export interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
  loading?: boolean
  error?: string
  className?: string
}

// ============================================================================
// ORGANISMS - Complex Components
// ============================================================================

/**
 * Sidebar - Desktop fixed sidebar navigation with collapse functionality
 */
export interface SidebarProps {
  items: NavigationItem[]
  isCollapsed?: boolean
  onCollapseToggle?: (collapsed: boolean) => void
  activeItem?: string
  userName?: string
  userAvatar?: string
}

export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  badge?: number | string
  disabled?: boolean
}

/**
 * TopBar - Mobile/tablet responsive top navigation bar
 */
export interface TopBarProps {
  title?: string
  showMenuToggle?: boolean
  onMenuToggle?: () => void
  showThemeToggle?: boolean
  userName?: string
  userAvatar?: string
  actions?: React.ReactNode
}

/**
 * KanbanColumn - Kanban column container for task cards
 */
export interface KanbanColumnProps {
  title: string
  status: TaskStatus
  tasks: TaskData[]
  count?: number
  onAddTask?: () => void
  onTaskUpdate?: (taskId: string, updates: Partial<TaskData>) => void
  onTaskDelete?: (taskId: string) => void
  onTaskClick?: (taskId: string) => void
  loading?: boolean
}

/**
 * TaskFilters - Task filtering controls
 */
export interface TaskFiltersProps {
  currentFilter: TaskFilter
  onFilterChange: (filter: Partial<TaskFilter>) => void
  onSearchChange: (search: string) => void
  totalCount: number
}

export interface TaskFilter {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  tags?: string[]
  search?: string
}

/**
 * ActivityLog - Recent activity timeline
 */
export interface ActivityLogProps {
  activities: ActivityItem[]
  loading?: boolean
  maxItems?: number
  onLoadMore?: () => void
}

export interface ActivityItem {
  id: string
  type: ActivityType
  description: string
  timestamp: Date
  metadata?: Record<string, any>
}

export type ActivityType = 'created' | 'completed' | 'updated' | 'deleted' | 'commented'

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Layout State - Manage sidebar and mobile menu state
 */
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

export interface UseLayoutState {
  state: LayoutState
  actions: LayoutActions
}

/**
 * Theme State - Provided by next-themes
 */
export interface ThemeState {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  resolvedTheme: 'light' | 'dark'
  systemTheme?: 'light' | 'dark'
}

/**
 * Dashboard State
 */
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
  color?: string
}

export interface TaskSummary {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  completionRate: number
}

/**
 * Tasks Page State
 */
export interface TasksPageState {
  tasks: TaskData[]
  filter: TaskFilter
  view: TaskView
  selectedTasks: string[]
  loading: boolean
  error?: string
}

export type TaskView = 'kanban' | 'list' | 'grid'

export interface TasksPageActions {
  setFilter: (filter: Partial<TaskFilter>) => void
  setView: (view: TaskView) => void
  selectTask: (taskId: string) => void
  deselectTask: (taskId: string) => void
  selectAll: () => void
  deselectAll: () => void
  refreshTasks: () => Promise<void>
}

// ============================================================================
// API INTEGRATION
// ============================================================================

/**
 * Task API Response - Existing API (no changes)
 */
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

/**
 * Transform API response to frontend TaskData
 */
export function transformTaskResponse(apiTask: TaskAPIResponse): TaskData {
  return {
    id: apiTask.id,
    title: apiTask.title,
    description: apiTask.description,
    priority: apiTask.priority,
    status: apiTask.completed ? 'done' : 'todo',
    tags: apiTask.tags,
    dueDate: apiTask.due_date ? new Date(apiTask.due_date) : undefined,
    completed: apiTask.completed,
    createdAt: new Date(apiTask.created_at),
    updatedAt: new Date(apiTask.updated_at),
  }
}

/**
 * Transform frontend TaskData to API request
 */
export function transformTaskRequest(task: Partial<TaskData>): Partial<TaskAPIResponse> {
  return {
    title: task.title,
    description: task.description,
    priority: task.priority,
    due_date: task.dueDate?.toISOString() || null,
    tags: task.tags,
    completed: task.completed,
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Loading State
 */
export interface LoadingState {
  isLoading: boolean
  error?: string
}

/**
 * Pagination
 */
export interface PaginationState {
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

/**
 * Sort Options
 */
export type SortField = 'created_at' | 'updated_at' | 'title' | 'priority' | 'due_date'
export type SortOrder = 'asc' | 'desc'

export interface SortOptions {
  field: SortField
  order: SortOrder
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Priority Colors - Used for visual indicators
 */
export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
}

/**
 * Priority Labels
 */
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low Priority',
  medium: 'Medium Priority',
  high: 'High Priority',
}

/**
 * Status Labels
 */
export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

/**
 * Status Colors
 */
export const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'text-gray-500',
  in_progress: 'text-blue-500',
  done: 'text-green-500',
}

/**
 * Activity Type Icons
 */
export const ACTIVITY_TYPE_ICONS: Record<ActivityType, string> = {
  created: 'Plus',
  completed: 'CheckCircle',
  updated: 'Edit',
  deleted: 'Trash2',
  commented: 'MessageCircle',
}
