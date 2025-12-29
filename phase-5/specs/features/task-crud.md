# Task CRUD Feature Specification

## Feature Overview

The Task CRUD feature enables authenticated users to create, read, update, and delete their personal tasks with full isolation from other users' data. This is the core feature of the todo application, providing comprehensive task management capabilities.

## User Stories

### US-1: Create Task
**As a** registered user
**I want to** create a new task with title, description, priority, due date, and tags
**So that** I can organize my work and track my responsibilities

**Acceptance Criteria**:
- ✅ User can create tasks with required field: title (max 200 characters)
- ✅ User can add optional fields: description (max 1000 characters), priority (low/medium/high), due date, tags
- ✅ Default priority is "medium" if not specified
- ✅ Task is associated with authenticated user's ID
- ✅ Task is saved to database with timestamps (created_at, updated_at)
- ✅ User receives success confirmation after creation
- ✅ Form validation prevents empty titles
- ✅ Created task appears immediately in task list

### US-2: List Tasks
**As a** registered user
**I want to** view all my tasks with filtering, sorting, and search options
**So that** I can quickly find and manage specific tasks

**Acceptance Criteria**:
- ✅ User can view all their tasks (no access to other users' tasks)
- ✅ Tasks display title, description, priority, due date, tags, completion status
- ✅ User can filter by status (all, pending, completed)
- ✅ User can filter by priority (low, medium, high)
- ✅ User can filter by due date range
- ✅ User can filter by tags
- ✅ User can sort by creation date, title, update time, priority, due date
- ✅ User can search tasks by title or description
- ✅ Pagination available for large task lists (default: 50 items per page)
- ✅ Loading states shown while fetching data

### US-3: Update Task
**As a** registered user
**I want to** edit task details
**So that** I can keep my tasks current and accurate

**Acceptance Criteria**:
- ✅ User can update title, description, priority, due date, and tags
- ✅ User can only update their own tasks (user isolation enforced)
- ✅ Updated_at timestamp is automatically updated on save
- ✅ Form validation prevents invalid data
- ✅ User receives success confirmation after update
- ✅ Changes reflect immediately in task list (optimistic updates)

### US-4: Delete Task
**As a** registered user
**I want to** permanently delete tasks
**So that** I can remove completed or unnecessary tasks

**Acceptance Criteria**:
- ✅ User can delete individual tasks
- ✅ User must confirm deletion before task is removed
- ✅ User can only delete their own tasks (user isolation enforced)
- ✅ Task is permanently removed from database
- ✅ User receives success confirmation after deletion
- ✅ Task disappears immediately from task list
- ✅ Undo option available after deletion (temporary recovery)

### US-5: Toggle Task Completion
**As a** registered user
**I want to** mark tasks as complete or incomplete
**So that** I can track my progress

**Acceptance Criteria**:
- ✅ User can toggle completion status with single click/tap
- ✅ Completed tasks show visual indication (strikethrough, checkmark)
- ✅ Updated_at timestamp is updated on status change
- ✅ User can only toggle their own tasks (user isolation enforced)
- ✅ Status change reflects immediately in UI (optimistic updates)
- ✅ Filtering by status (pending/completed) works correctly

## Advanced Features

### Filtering
- **Status Filter**: all, pending, completed
- **Priority Filter**: low, medium, high
- **Due Date Filter**: from date, to date
- **Tag Filter**: multiple tag selection
- **Implementation**: Query parameters in API (`?status=pending&priority=high`)

### Sorting
- **Available Fields**: created_at, title, updated_at, priority, due_date
- **Order**: ascending (asc) or descending (desc)
- **Implementation**: Query parameter (`?sort=created:desc`)
- **Default**: created_at descending (newest first)

### Search
- **Search Fields**: title and description
- **Type**: Case-insensitive partial match
- **Implementation**: Query parameter (`?search=keyword`)
- **Debouncing**: 300ms delay to reduce API calls

### Pagination
- **Page Size**: Default 50 items, max 100
- **Implementation**: Query parameters (`?page=1&limit=50`)
- **Response**: Includes total count, current page, total pages

### Export/Import
- **Export Formats**: CSV, JSON, PDF
- **Export Endpoint**: `GET /api/{user_id}/tasks/export?format=csv`
- **Import Formats**: CSV, JSON
- **Import Endpoint**: `POST /api/{user_id}/tasks/import` with file upload
- **Validation**: Import validates data and reports errors

### Bulk Operations
- **Supported Operations**: delete, complete, pending, priority changes
- **Endpoint**: `POST /api/{user_id}/tasks/bulk?operation=delete&task_ids=1,2,3`
- **Selection**: Multi-select checkboxes in UI
- **Confirmation**: User must confirm bulk delete operations

### Statistics
- **Metrics**: total tasks, completed, pending, overdue
- **Priority Breakdown**: count by priority level
- **Endpoint**: `GET /api/{user_id}/tasks/statistics`
- **Display**: Dashboard statistics card

### Undo/Redo
- **Pattern**: Command pattern for reversible operations
- **Supported**: Create, update, delete, toggle completion
- **Storage**: In-memory command history (client-side)
- **Keyboard**: Ctrl+Z (undo), Ctrl+Shift+Z (redo)

## API Endpoints

### Create Task
```http
POST /api/{user_id}/tasks
Authorization: Bearer {jwt_token}
Content-Type: application/json

Request Body:
{
  "title": "Complete project documentation",
  "description": "Write comprehensive docs for Phase II",
  "priority": "high",
  "due_date": "2025-12-31T23:59:59Z",
  "tags": ["work", "urgent"]
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": 42,
    "user_id": "uuid-string",
    "title": "Complete project documentation",
    "description": "Write comprehensive docs for Phase II",
    "priority": "high",
    "due_date": "2025-12-31T23:59:59Z",
    "tags": ["work", "urgent"],
    "completed": false,
    "created_at": "2025-12-13T10:00:00Z",
    "updated_at": "2025-12-13T10:00:00Z"
  }
}
```

### List Tasks
```http
GET /api/{user_id}/tasks?status=pending&sort=created:desc&page=1&limit=50
Authorization: Bearer {jwt_token}

Response: 200 OK
{
  "success": true,
  "data": {
    "items": [ /* array of tasks */ ],
    "total": 142,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

### Get Single Task
```http
GET /api/{user_id}/tasks/{task_id}
Authorization: Bearer {jwt_token}

Response: 200 OK
{
  "success": true,
  "data": { /* task object */ }
}
```

### Update Task
```http
PUT /api/{user_id}/tasks/{task_id}
Authorization: Bearer {jwt_token}
Content-Type: application/json

Request Body:
{
  "title": "Updated title",
  "priority": "low"
}

Response: 200 OK
{
  "success": true,
  "data": { /* updated task object */ }
}
```

### Delete Task
```http
DELETE /api/{user_id}/tasks/{task_id}
Authorization: Bearer {jwt_token}

Response: 200 OK
{
  "success": true,
  "message": "Task deleted successfully"
}
```

### Toggle Completion
```http
PATCH /api/{user_id}/tasks/{task_id}/complete
Authorization: Bearer {jwt_token}
Content-Type: application/json

Request Body:
{
  "completed": true
}

Response: 200 OK
{
  "success": true,
  "data": { /* updated task object */ }
}
```

**Related**: See `@specs/api/rest-endpoints.md` for complete API documentation

## Frontend Components

### TaskForm.tsx
- **Purpose**: Create and edit tasks
- **Type**: Client Component (form interactivity)
- **Props**: `mode: 'create' | 'edit'`, `initialData?: Task`, `onSubmit`, `onCancel`
- **Features**: Form validation, controlled inputs, error display

### TaskList.tsx
- **Purpose**: Display list of tasks
- **Type**: Client Component (drag-drop, selection)
- **Props**: `tasks: Task[]`, `onUpdate`, `onDelete`, `onToggle`
- **Features**: Drag-drop reordering, bulk selection, virtualization

### TaskItem.tsx
- **Purpose**: Single task display
- **Type**: Client Component (interactive)
- **Props**: `task: Task`, `onEdit`, `onDelete`, `onToggle`, `selected`
- **Features**: Inline editing, completion toggle, priority indicator

### FilterControls.tsx
- **Purpose**: Task filtering UI
- **Type**: Client Component (form controls)
- **Props**: `filters`, `onFilterChange`
- **Features**: Status, priority, date range, tag filters

### SortControls.tsx
- **Purpose**: Task sorting UI
- **Type**: Client Component (dropdown)
- **Props**: `sortBy`, `onSortChange`
- **Features**: Sort field and direction selection

### SearchBar.tsx
- **Purpose**: Task search input
- **Type**: Client Component (input)
- **Props**: `value`, `onChange`
- **Features**: Debounced search, clear button

### BulkActions.tsx
- **Purpose**: Bulk operation controls
- **Type**: Client Component (buttons)
- **Props**: `selectedTasks`, `onBulkAction`
- **Features**: Delete, complete, priority change buttons

### TaskStatistics.tsx
- **Purpose**: Dashboard statistics
- **Type**: Server Component (data fetching)
- **Props**: `userId`
- **Features**: Total, completed, pending, overdue counts

**Related**: See `@specs/ui/components.md` for complete component documentation

## Database Operations

### Task Model (SQLModel)
```python
class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(nullable=False, index=True)
    title: str = Field(max_length=200, nullable=False)
    description: Optional[str] = Field(default=None, max_length=1000)
    priority: str = Field(default="medium", nullable=False, index=True)
    due_date: Optional[datetime] = Field(default=None, index=True)
    tags: Optional[list[str]] = Field(default=None, sa_column=Column(JSON))
    completed: bool = Field(default=False, nullable=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

### User Isolation
**All queries MUST include user_id filter**:
```python
# Correct - filters by user_id
statement = select(Task).where(Task.user_id == user_id)

# Incorrect - missing user_id filter (security violation)
statement = select(Task)  # ❌ NEVER DO THIS
```

### Indexes
- `idx_tasks_user_id` on `user_id` (for user filtering)
- `idx_tasks_completed` on `completed` (for status filtering)
- `idx_tasks_priority` on `priority` (for priority filtering)
- `idx_tasks_due_date` on `due_date` (for date filtering/sorting)

**Related**: See `@specs/database/schema.md` for complete database documentation

## Security & User Isolation

### Backend Enforcement
1. **JWT Verification**: All endpoints require valid JWT token
2. **User ID Verification**: URL `user_id` must match JWT token `user_id`
3. **Database Filtering**: All queries filtered by authenticated `user_id`
4. **No Cross-User Access**: Users cannot access other users' tasks

### Frontend Protection
1. **Protected Routes**: Dashboard requires authentication
2. **API Client**: Automatically includes JWT token in all requests
3. **User Context**: Only shows authenticated user's tasks
4. **Error Handling**: 401/403 errors redirect to login

## Testing Requirements

### Backend Tests
- ✅ Create task with valid data
- ✅ Create task with missing required fields (400 error)
- ✅ Create task without authentication (401 error)
- ✅ List tasks filtered by user_id (user isolation)
- ✅ List tasks with filtering, sorting, search
- ✅ Update task belonging to user
- ✅ Update task belonging to different user (403 error)
- ✅ Delete task belonging to user
- ✅ Delete task belonging to different user (403 error)
- ✅ Toggle completion status
- ✅ Export tasks to CSV, JSON, PDF
- ✅ Import tasks from CSV, JSON
- ✅ Bulk operations (delete, complete, priority)
- ✅ Statistics calculation

### Frontend Tests
- ✅ Render task list
- ✅ Create new task
- ✅ Edit existing task
- ✅ Delete task with confirmation
- ✅ Toggle task completion
- ✅ Filter tasks by status, priority
- ✅ Sort tasks by different fields
- ✅ Search tasks
- ✅ Bulk select and delete
- ✅ Export tasks
- ✅ Import tasks

## Related Specifications

- **`@specs/features/authentication.md`** - User authentication flow
- **`@specs/api/rest-endpoints.md`** - Complete API endpoint documentation
- **`@specs/database/schema.md`** - Database schema and models
- **`@specs/ui/components.md`** - Frontend component library
- **`@specs/architecture.md`** - System architecture and data flow
