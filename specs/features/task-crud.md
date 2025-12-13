# Task CRUD Feature Specification

## Overview

The Task CRUD feature provides comprehensive task management capabilities including create, read, update, delete, and mark complete operations. It includes advanced features like filtering, sorting, search, pagination, export/import, and bulk operations with strict user isolation enforcement.

## User Stories

### 1. Add Task (Create)

**As a** registered user
**I want to** create new tasks with title, description, priority, due date, and tags
**So that** I can organize and track my work

**Acceptance Criteria:**
- User can create a task with required title field
- User can optionally add description (max 1000 characters)
- User can set priority level: low, medium (default), high
- User can set due date using date picker
- User can add multiple tags for categorization
- Task is automatically associated with the authenticated user
- Backend validates all input fields
- Success/error feedback is shown via toast notifications
- New task appears in the task list immediately

### 2. List Tasks (Read)

**As a** registered user
**I want to** view all my tasks with filtering, sorting, search, and pagination
**So that** I can quickly find and manage my tasks

**Acceptance Criteria:**
- User can view all their tasks (user isolation enforced)
- Tasks are displayed with all details: title, description, priority, due date, tags, completion status
- Default sorting: newest first (created:desc)
- User can filter by:
  - Status: all (default), pending, completed
  - Priority: low, medium, high
  - Due date range: from date, to date
  - Tags: comma-separated list
- User can search by title and description (case-insensitive)
- User can sort by:
  - Creation date (created:asc, created:desc)
  - Update date (updated:asc, updated:desc)
  - Priority (priority:asc, priority:desc)
  - Due date (due_date:asc, due_date:desc)
  - Title (title:asc, title:desc)
- Pagination with configurable items per page (1-100, default: 50)
- Loading states shown during data fetch
- Empty state shown when no tasks match filters

### 3. Update Task

**As a** registered user
**I want to** edit existing tasks
**So that** I can keep my task information accurate and up-to-date

**Acceptance Criteria:**
- User can update any field: title, description, priority, due date, tags
- User can only update their own tasks (user isolation)
- Title field is required (cannot be empty)
- Changes are validated on backend
- Success/error feedback shown via toast notifications
- Updated task reflects changes immediately in the list
- Updated timestamp is automatically set

### 4. Delete Task

**As a** registered user
**I want to** delete tasks I no longer need
**So that** I can keep my task list clean and relevant

**Acceptance Criteria:**
- User can delete any of their tasks
- User can only delete their own tasks (user isolation)
- Confirmation dialog shown before deletion
- Task is removed from list immediately after deletion
- Success feedback shown via toast notifications
- Undo option available for 5 seconds after deletion
- Deleted tasks are permanently removed from database

### 5. Mark Complete/Toggle Completion

**As a** registered user
**I want to** mark tasks as complete or incomplete
**So that** I can track my progress

**Acceptance Criteria:**
- User can toggle completion status with single click/tap
- Completed tasks show visual indicator (checkmark, strikethrough)
- User can only toggle their own tasks (user isolation)
- Changes are persisted immediately to backend
- Visual feedback provided on success/error
- Undo option available after toggling
- Completion status reflected in filters and statistics

### 6. Filter Tasks

**As a** registered user
**I want to** filter tasks by status, priority, due date, and tags
**So that** I can focus on specific subsets of tasks

**Acceptance Criteria:**
- Status filter options: all, pending, completed
- Priority filter options: low, medium, high (multi-select)
- Due date range filter: from date, to date
- Tag filter: comma-separated list (OR logic)
- Filters can be combined (AND logic between filter types)
- Filter state persists during session
- Filter controls are easily accessible
- Clear all filters button available
- URL query parameters reflect active filters

### 7. Sort Tasks

**As a** registered user
**I want to** sort tasks by different criteria
**So that** I can view tasks in my preferred order

**Acceptance Criteria:**
- Sort fields: created, updated, title, priority, due_date
- Sort directions: asc (ascending), desc (descending)
- Default sort: created:desc (newest first)
- Sort state persists during session
- Sort indicator shows current sort field and direction
- URL query parameter reflects active sort
- Backend performs sorting for consistency

### 8. Search Tasks

**As a** registered user
**I want to** search tasks by keywords
**So that** I can quickly find specific tasks

**Acceptance Criteria:**
- Search searches both title and description fields
- Case-insensitive search
- Real-time search (debounced 300ms)
- Search input accessible in header
- Search state persists during session
- Clear search button available
- Search combined with filters and sort
- Backend performs search for accuracy

### 9. Pagination

**As a** registered user
**I want to** navigate through pages of tasks
**So that** I can handle large task lists efficiently

**Acceptance Criteria:**
- Default page size: 50 items
- User can change page size (1-100)
- Pagination controls show: current page, total pages, total items
- Next/previous page buttons available
- Jump to specific page option
- Pagination state in URL query parameters
- Loading states during page transitions
- Page size preference persists during session

### 10. Export Tasks

**As a** registered user
**I want to** export my tasks to CSV, JSON, or PDF
**So that** I can backup, share, or analyze my tasks externally

**Acceptance Criteria:**
- Export formats: CSV, JSON, PDF
- Export includes all task fields and metadata
- Exported file includes timestamp in filename
- Export downloads automatically
- Export respects current filters (exports visible tasks or all tasks based on user choice)
- Export feedback shown via toast notifications
- PDF export includes formatted layout
- CSV export compatible with Excel/Google Sheets

### 11. Import Tasks

**As a** registered user
**I want to** import tasks from CSV or JSON files
**So that** I can quickly add multiple tasks or migrate from other systems

**Acceptance Criteria:**
- Import formats: CSV, JSON
- File validation before processing
- Import validates each task (required fields, data types)
- Import statistics shown: imported count, error count
- Error list provided for failed imports
- Imported tasks associated with authenticated user
- Duplicate handling (based on title match)
- Import progress indicator
- Success/error feedback via toast notifications

### 12. Bulk Operations

**As a** registered user
**I want to** perform operations on multiple tasks at once
**So that** I can manage tasks more efficiently

**Acceptance Criteria:**
- Bulk operations available: delete, complete, pending, set priority
- User can select multiple tasks via checkboxes
- Select all / deselect all options available
- Bulk operation buttons enabled only when tasks selected
- Confirmation dialog for destructive operations (delete)
- Operation results shown: success count, error count
- Undo option for bulk operations
- User isolation enforced (can only operate on own tasks)

### 13. Drag-and-Drop Reordering

**As a** registered user
**I want to** reorder tasks by dragging and dropping
**So that** I can prioritize tasks visually

**Acceptance Criteria:**
- Tasks can be dragged and dropped to reorder
- Visual feedback during drag (opacity, cursor)
- Drop zones highlighted
- Order persisted to backend
- Reorder only affects user's own tasks
- Keyboard accessibility for reordering
- Touch support for mobile devices

### 14. Task Statistics

**As a** registered user
**I want to** view statistics about my tasks
**So that** I can understand my productivity and task distribution

**Acceptance Criteria:**
- Statistics displayed: total tasks, completed, pending, overdue
- Priority breakdown: low, medium, high counts
- Statistics update in real-time with task changes
- Visual representation (charts/badges)
- Statistics respect current filters
- Accessible on dashboard

## API Endpoints

All endpoints enforce user isolation and require JWT authentication.

### Create Task
```
POST /api/{user_id}/tasks
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Task title (required, max 200 chars)",
  "description": "Task description (optional, max 1000 chars)",
  "priority": "low|medium|high (default: medium)",
  "due_date": "ISO 8601 datetime (optional)",
  "tags": ["tag1", "tag2"] (optional array of strings)
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "uuid-string",
    "title": "Task title",
    "description": "Task description",
    "priority": "medium",
    "due_date": "2024-12-31T23:59:59Z",
    "tags": ["tag1", "tag2"],
    "completed": false,
    "created_at": "2024-12-13T10:00:00Z",
    "updated_at": "2024-12-13T10:00:00Z"
  }
}
```

### Get Tasks (with filtering, sorting, search, pagination)
```
GET /api/{user_id}/tasks?status=all&priority=medium,high&due_date_from=2024-01-01&due_date_to=2024-12-31&tags=work,urgent&sort=created:desc&search=keyword&page=1&limit=50
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `status`: all | pending | completed (default: all)
- `priority`: Comma-separated: low,medium,high
- `due_date_from`: ISO date (YYYY-MM-DD)
- `due_date_to`: ISO date (YYYY-MM-DD)
- `tags`: Comma-separated list
- `sort`: field:direction (created:desc, title:asc, etc.)
- `search`: Search keyword for title/description
- `page`: Page number (min: 1, default: 1)
- `limit`: Items per page (1-100, default: 50)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [...tasks],
    "total": 100,
    "page": 1,
    "limit": 50,
    "totalPages": 2
  }
}
```

### Get Single Task
```
GET /api/{user_id}/tasks/{task_id}
Authorization: Bearer <jwt_token>
```

**Response (200):** Single task object

### Update Task
```
PUT /api/{user_id}/tasks/{task_id}
Authorization: Bearer <jwt_token>
```

**Request Body:** Same as Create Task (partial updates supported)

**Response (200):** Updated task object

### Delete Task
```
DELETE /api/{user_id}/tasks/{task_id}
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

### Toggle Complete
```
PATCH /api/{user_id}/tasks/{task_id}/complete
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "completed": true
}
```

**Response (200):** Updated task object

### Export Tasks
```
GET /api/{user_id}/tasks/export?format=csv|json|pdf
Authorization: Bearer <jwt_token>
```

**Response (200):** File download with appropriate content-type

### Import Tasks
```
POST /api/{user_id}/tasks/import
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request:** File upload (CSV or JSON)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "imported": 45,
    "errors": 5,
    "errors_list": ["Error details..."]
  }
}
```

### Bulk Operations
```
POST /api/{user_id}/tasks/bulk?operation=delete|complete|pending|priority_low|priority_medium|priority_high&task_ids=1,2,3
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": 10,
    "failed": 0
  }
}
```

### Get Statistics
```
GET /api/{user_id}/tasks/statistics
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "completed": 45,
    "pending": 55,
    "overdue": 10,
    "by_priority": {
      "low": 20,
      "medium": 50,
      "high": 30
    }
  }
}
```

### Reorder Tasks
```
POST /api/{user_id}/tasks/reorder
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "task_ids": [3, 1, 5, 2, 4]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reordered": 5
  }
}
```

## Frontend Components Involved

See `@specs/ui/components.md` for detailed component documentation.

**Main Components:**
- `TaskList` - Displays list of tasks with drag-and-drop
- `TaskItem` - Individual task card with actions
- `TaskForm` - Create/edit task form
- `FilterControls` - Filter options (status, priority, date, tags)
- `SortControls` - Sort field and direction selector
- `SearchBar` - Search input with debouncing
- `PaginationControls` - Page navigation
- `BulkActions` - Bulk operation buttons
- `ExportImportControls` - Export/import buttons
- `TaskStatistics` - Statistics dashboard
- `UndoRedoControls` - Undo/redo action buttons

## Database Operations

See `@specs/database/schema.md` for schema details.

**Task Model Fields:**
```python
class Task(SQLModel, table=True):
    id: Optional[int]              # Primary key (auto-increment)
    user_id: str                   # Foreign key to Better Auth users (indexed)
    title: str                     # Required, max 200 chars
    description: Optional[str]      # Optional, max 1000 chars
    priority: str                  # low|medium|high (default: medium, indexed)
    due_date: Optional[datetime]   # Optional (indexed)
    tags: Optional[list[str]]      # JSON array (optional)
    completed: bool                # Default: False (indexed)
    created_at: datetime           # Auto-set on creation
    updated_at: datetime           # Auto-updated on modification
```

**Indexes:**
- `user_id` - For user isolation filtering
- `completed` - For status filtering
- `priority` - For priority filtering
- `due_date` - For date range filtering and sorting

**User Isolation:**
All queries MUST include `WHERE user_id = <authenticated_user_id>` to enforce data isolation between users.

## Business Logic (Service Layer)

**File:** `@backend/services/task_service.py`

**Key Functions:**
- `create_task(db, user_id, task_data)` - Create new task
- `get_tasks(db, user_id, query_params)` - Get tasks with filters/sort/search/pagination
- `get_task_by_id(db, user_id, task_id)` - Get single task (with user isolation)
- `update_task(db, user_id, task_id, task_data)` - Update task
- `delete_task(db, user_id, task_id)` - Delete task
- `toggle_complete(db, user_id, task_id, completed)` - Toggle completion status
- `get_task_statistics(db, user_id)` - Get task statistics
- `bulk_operations(db, user_id, operation, task_ids)` - Perform bulk operations

**File:** `@backend/services/export_import_service.py`

**Key Functions:**
- `export_tasks_csv(tasks)` - Export tasks to CSV string
- `export_tasks_json(tasks)` - Export tasks to JSON string
- `export_tasks_pdf(tasks)` - Export tasks to PDF bytes
- `import_tasks_csv(db, user_id, csv_content)` - Import tasks from CSV
- `import_tasks_json(db, user_id, json_content)` - Import tasks from JSON

## Security Considerations

1. **User Isolation:** All database queries filter by authenticated user's ID
2. **JWT Verification:** All endpoints require valid JWT token
3. **User ID Verification:** URL path user_id must match JWT token user_id
4. **Input Validation:** All inputs validated via Pydantic models
5. **SQL Injection Prevention:** SQLModel uses parameterized queries
6. **XSS Prevention:** Frontend sanitizes user input before rendering
7. **Rate Limiting:** API endpoints protected by rate limiting middleware
8. **CORS Configuration:** Restricted to trusted origins only

## Error Handling

**Backend Error Codes:**
- `VALIDATION_ERROR` - Invalid input data
- `TASK_NOT_FOUND` - Task does not exist
- `FORBIDDEN` - User ID mismatch
- `TOKEN_EXPIRED` - JWT token expired
- `INVALID_TOKEN` - Invalid JWT token
- `INTERNAL_ERROR` - Server error

**Frontend Error Handling:**
- All API errors displayed via toast notifications
- Network errors retry automatically (max 3 times)
- User-friendly error messages
- Error boundary catches component errors

## Performance Optimizations

1. **Backend:**
   - Database indexes on frequently queried fields (user_id, completed, priority, due_date)
   - Pagination limits result set size
   - Efficient SQL queries with proper filtering
   - Connection pooling for database

2. **Frontend:**
   - Debounced search (300ms)
   - Lazy loading for large lists
   - Optimistic updates for better UX
   - Client-side caching of API responses
   - Virtual scrolling for large task lists

## Accessibility

- Keyboard navigation support (Tab, Enter, Esc)
- ARIA labels on all interactive elements
- Focus management for modals and forms
- Screen reader announcements for actions
- High contrast mode support
- Keyboard shortcuts for common actions

## Related Specifications

- `@specs/features/authentication.md` - Authentication flow and JWT tokens
- `@specs/api/rest-endpoints.md` - Complete API documentation
- `@specs/database/schema.md` - Database schema and models
- `@specs/ui/components.md` - React component documentation
- `@specs/ui/pages.md` - Next.js pages and routing
- `@specs/architecture.md` - System architecture overview
