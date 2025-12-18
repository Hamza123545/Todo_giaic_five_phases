# REST API Endpoints Specification

**Status**: Implemented
**Version**: 1.0
**Last Updated**: 2025-12-13

## Overview

This document describes all REST API endpoints for the Phase II Todo application. All endpoints require JWT authentication (except authentication endpoints). The API follows RESTful conventions and returns JSON responses.

## Table of Contents

1. [Base URLs](#base-urls)
2. [Authentication](#authentication)
3. [Common Response Format](#common-response-format)
4. [Error Codes](#error-codes)
5. [Task Endpoints](#task-endpoints)
6. [Authentication Endpoints](#authentication-endpoints)
7. [Related Specifications](#related-specifications)

---

## Base URLs

### Development
```
Frontend: http://localhost:3000
Backend:  http://localhost:8000
```

### Production
```
Frontend: https://todo-giaic-five-phases.vercel.app
Backend:  https://your-backend-domain.com
```

**Environment Variables**:
- `NEXT_PUBLIC_API_URL`: Backend API URL (frontend)
- `NEXT_PUBLIC_APP_URL`: Frontend URL (frontend)
- `CORS_ORIGINS`: Allowed frontend origins (backend)

---

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```http
Authorization: Bearer <jwt_token>
```

### How to Get Token

1. Sign in via `POST /api/auth/sign-in/email`
2. Token is returned in response body and stored in HTTP-only cookie
3. Include token in `Authorization` header for all subsequent requests

### Token Format

```json
{
  "user_id": "uuid-string",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234971490
}
```

**Token Expiration**: 7 days (configurable)

---

## Common Response Format

All API responses follow a consistent JSON structure:

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

---

## Error Codes

### HTTP Status Codes

| Status Code | Meaning | When Used |
|------------|---------|-----------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors, invalid input |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User ID mismatch, insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource (e.g., email already exists) |
| 500 | Internal Server Error | Server-side errors |

### Application Error Codes

| Error Code | HTTP Status | Description |
|-----------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `TOKEN_EXPIRED` | 401 | JWT token has expired |
| `INVALID_TOKEN` | 401 | JWT token is invalid or malformed |
| `TOKEN_ERROR` | 401 | Token verification failed |
| `FORBIDDEN` | 403 | User ID mismatch |
| `TASK_NOT_FOUND` | 404 | Task does not exist |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Task Endpoints

All task endpoints require authentication and enforce user isolation.

### 1. Create Task

Create a new task for the authenticated user.

**Endpoint**: `POST /api/{user_id}/tasks`

**Authentication**: Required

**Path Parameters**:
- `user_id` (string, required): User ID (must match JWT token)

**Request Body**:
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "priority": "medium",
  "due_date": "2025-12-20T00:00:00Z",
  "tags": ["shopping", "urgent"]
}
```

**Request Body Schema**:
| Field | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `title` | string | Yes | 1-200 characters | - |
| `description` | string | No | Max 1000 characters | null |
| `priority` | string | No | "low", "medium", "high" | "medium" |
| `due_date` | string (ISO 8601) | No | Valid date, not in past | null |
| `tags` | array of strings | No | Lowercase, unique | [] |

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "uuid-string",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "priority": "medium",
    "due_date": "2025-12-20T00:00:00Z",
    "tags": ["shopping", "urgent"],
    "completed": false,
    "created_at": "2025-12-13T10:30:00Z",
    "updated_at": "2025-12-13T10:30:00Z"
  }
}
```

**Error Responses**:
- 400 Bad Request: Invalid input (title too long, invalid priority, etc.)
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: `user_id` in path does not match JWT token

---

### 2. Get All Tasks (with Filtering, Sorting, Search, Pagination)

Retrieve tasks for the authenticated user with comprehensive query parameters.

**Endpoint**: `GET /api/{user_id}/tasks`

**Authentication**: Required

**Path Parameters**:
- `user_id` (string, required): User ID (must match JWT token)

**Query Parameters**:

| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `status` | string | No | Filter by completion status: "all", "pending", "completed" | "all" |
| `priority` | string | No | Filter by priority: "low", "medium", "high" | - |
| `due_date_from` | string (ISO 8601) | No | Filter tasks with due date from this date | - |
| `due_date_to` | string (ISO 8601) | No | Filter tasks with due date until this date | - |
| `tags` | string | No | Comma-separated list of tags (e.g., "work,urgent") | - |
| `sort` | string | No | Sort order: "created:asc", "created:desc", "title:asc", "title:desc", "updated:asc", "updated:desc", "priority:asc", "priority:desc", "due_date:asc", "due_date:desc" | "created:desc" |
| `search` | string | No | Search keyword for title and description | - |
| `page` | integer | No | Page number (1-based) | 1 |
| `limit` | integer | No | Items per page (1-100) | 50 |

**Example Request**:
```http
GET /api/{user_id}/tasks?status=pending&priority=high&sort=due_date:asc&search=groceries&page=1&limit=20
Authorization: Bearer <jwt_token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "user_id": "uuid-string",
        "title": "Buy groceries",
        "description": "Milk, eggs, bread",
        "priority": "high",
        "due_date": "2025-12-20T00:00:00Z",
        "tags": ["shopping", "urgent"],
        "completed": false,
        "created_at": "2025-12-13T10:30:00Z",
        "updated_at": "2025-12-13T10:30:00Z"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**Pagination Metadata**:
- `total`: Total number of tasks matching filters
- `page`: Current page number
- `limit`: Items per page
- `totalPages`: Total number of pages

**Error Responses**:
- 400 Bad Request: Invalid query parameters (e.g., invalid sort format)
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: `user_id` mismatch

---

### 3. Get Task by ID

Retrieve a specific task by ID.

**Endpoint**: `GET /api/{user_id}/tasks/{task_id}`

**Authentication**: Required

**Path Parameters**:
- `user_id` (string, required): User ID (must match JWT token)
- `task_id` (integer, required): Task ID

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "uuid-string",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "priority": "medium",
    "due_date": "2025-12-20T00:00:00Z",
    "tags": ["shopping", "urgent"],
    "completed": false,
    "created_at": "2025-12-13T10:30:00Z",
    "updated_at": "2025-12-13T10:30:00Z"
  }
}
```

**Error Responses**:
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: `user_id` mismatch
- 404 Not Found: Task does not exist or does not belong to user

---

### 4. Update Task

Update a task's details.

**Endpoint**: `PUT /api/{user_id}/tasks/{task_id}`

**Authentication**: Required

**Path Parameters**:
- `user_id` (string, required): User ID (must match JWT token)
- `task_id` (integer, required): Task ID

**Request Body**:
```json
{
  "title": "Buy groceries (updated)",
  "description": "Milk, eggs, bread, cheese",
  "priority": "high",
  "due_date": "2025-12-21T00:00:00Z",
  "tags": ["shopping", "urgent", "weekly"]
}
```

**Request Body Schema**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | Yes | 1-200 characters |
| `description` | string | No | Max 1000 characters |
| `priority` | string | No | "low", "medium", "high" |
| `due_date` | string (ISO 8601) | No | Valid date |
| `tags` | array of strings | No | Lowercase, unique |

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "uuid-string",
    "title": "Buy groceries (updated)",
    "description": "Milk, eggs, bread, cheese",
    "priority": "high",
    "due_date": "2025-12-21T00:00:00Z",
    "tags": ["shopping", "urgent", "weekly"],
    "completed": false,
    "created_at": "2025-12-13T10:30:00Z",
    "updated_at": "2025-12-13T11:00:00Z"
  }
}
```

**Error Responses**:
- 400 Bad Request: Invalid input
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: `user_id` mismatch
- 404 Not Found: Task does not exist

---

### 5. Delete Task

Delete a task.

**Endpoint**: `DELETE /api/{user_id}/tasks/{task_id}`

**Authentication**: Required

**Path Parameters**:
- `user_id` (string, required): User ID (must match JWT token)
- `task_id` (integer, required): Task ID

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

**Error Responses**:
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: `user_id` mismatch
- 404 Not Found: Task does not exist

---

### 6. Toggle Task Completion

Toggle a task's completion status.

**Endpoint**: `PATCH /api/{user_id}/tasks/{task_id}/complete`

**Authentication**: Required

**Path Parameters**:
- `user_id` (string, required): User ID (must match JWT token)
- `task_id` (integer, required): Task ID

**Request Body**:
```json
{
  "completed": true
}
```

**Request Body Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `completed` | boolean | Yes | New completion status |

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "uuid-string",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "priority": "medium",
    "due_date": "2025-12-20T00:00:00Z",
    "tags": ["shopping", "urgent"],
    "completed": true,
    "created_at": "2025-12-13T10:30:00Z",
    "updated_at": "2025-12-13T11:15:00Z"
  }
}
```

**Error Responses**:
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: `user_id` mismatch
- 404 Not Found: Task does not exist

---

### 7. Export Tasks

Export user's tasks to CSV, JSON, or PDF format.

**Endpoint**: `GET /api/{user_id}/tasks/export`

**Authentication**: Required

**Path Parameters**:
- `user_id` (string, required): User ID (must match JWT token)

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `format` | string | Yes | Export format: "csv", "json", "pdf" |

**Example Request**:
```http
GET /api/{user_id}/tasks/export?format=csv
Authorization: Bearer <jwt_token>
```

**Success Response** (200 OK):
- **Content-Type**: Depends on format
  - CSV: `text/csv`
  - JSON: `application/json`
  - PDF: `application/pdf`
- **Headers**: `Content-Disposition: attachment; filename=tasks_export_20251213_103000.{ext}`
- **Body**: File content (CSV, JSON, or PDF bytes)

**CSV Format**:
```csv
id,title,description,priority,due_date,tags,completed,created_at,updated_at
1,"Buy groceries","Milk, eggs, bread",medium,2025-12-20T00:00:00Z,"shopping,urgent",false,2025-12-13T10:30:00Z,2025-12-13T10:30:00Z
```

**JSON Format**:
```json
[
  {
    "id": 1,
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "priority": "medium",
    "due_date": "2025-12-20T00:00:00Z",
    "tags": ["shopping", "urgent"],
    "completed": false,
    "created_at": "2025-12-13T10:30:00Z",
    "updated_at": "2025-12-13T10:30:00Z"
  }
]
```

**PDF Format**: Formatted table with tasks

**Error Responses**:
- 400 Bad Request: Invalid format parameter
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: `user_id` mismatch

---

### 8. Import Tasks

Import tasks from CSV or JSON file.

**Endpoint**: `POST /api/{user_id}/tasks/import`

**Authentication**: Required

**Path Parameters**:
- `user_id` (string, required): User ID (must match JWT token)

**Request Body**: `multipart/form-data`
- `file` (file, required): CSV or JSON file

**CSV Format**:
```csv
title,description,priority,due_date,tags
"Buy groceries","Milk, eggs, bread",medium,2025-12-20,"shopping,urgent"
```

**JSON Format**:
```json
[
  {
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "priority": "medium",
    "due_date": "2025-12-20T00:00:00Z",
    "tags": ["shopping", "urgent"]
  }
]
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "imported": 5,
    "errors": 2,
    "errors_list": [
      "Row 3: Invalid priority 'urgent' (must be low, medium, or high)",
      "Row 7: Title is required"
    ]
  }
}
```

**Response Fields**:
- `imported`: Number of tasks successfully imported
- `errors`: Number of tasks that failed to import
- `errors_list`: Array of error messages (one per failed task)

**Error Responses**:
- 400 Bad Request: Invalid file type (only CSV and JSON allowed)
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: `user_id` mismatch

---

### 9. Reorder Tasks

Update the order of tasks (for drag-and-drop UI).

**Endpoint**: `POST /api/{user_id}/tasks/reorder`

**Authentication**: Required

**Path Parameters**:
- `user_id` (string, required): User ID (must match JWT token)

**Request Body**:
```json
[1, 5, 3, 2, 4]
```

**Request Body Schema**: Array of task IDs in desired order

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "reordered": 5
  }
}
```

**Note**: In the current implementation, tasks don't have an explicit `order` field. This endpoint verifies that all tasks belong to the user. The frontend maintains the order client-side.

**Error Responses**:
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: `user_id` mismatch
- 404 Not Found: One or more tasks do not exist

---

### 10. Get Task Statistics

Get aggregated task statistics for the authenticated user.

**Endpoint**: `GET /api/{user_id}/tasks/statistics`

**Authentication**: Required

**Path Parameters**:
- `user_id` (string, required): User ID (must match JWT token)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total": 42,
    "completed": 25,
    "pending": 17,
    "overdue": 3,
    "by_priority": {
      "low": 10,
      "medium": 20,
      "high": 12
    },
    "completion_rate": 0.595
  }
}
```

**Response Fields**:
- `total`: Total number of tasks
- `completed`: Number of completed tasks
- `pending`: Number of pending tasks
- `overdue`: Number of tasks past due date
- `by_priority`: Task count by priority level
- `completion_rate`: Percentage of completed tasks (0.0 - 1.0)

**Error Responses**:
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: `user_id` mismatch

---

### 11. Bulk Operations

Perform bulk operations on multiple tasks.

**Endpoint**: `POST /api/{user_id}/tasks/bulk`

**Authentication**: Required

**Path Parameters**:
- `user_id` (string, required): User ID (must match JWT token)

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `operation` | string | Yes | Bulk operation type: "delete", "complete", "pending", "priority_low", "priority_medium", "priority_high" |
| `task_ids` | array of integers | Yes | List of task IDs to operate on (comma-separated in URL) |

**Example Request**:
```http
POST /api/{user_id}/tasks/bulk?operation=complete&task_ids=1,2,3,4,5
Authorization: Bearer <jwt_token>
```

**Supported Operations**:
| Operation | Description |
|-----------|-------------|
| `delete` | Delete selected tasks |
| `complete` | Mark selected tasks as completed |
| `pending` | Mark selected tasks as pending |
| `priority_low` | Set selected tasks priority to low |
| `priority_medium` | Set selected tasks priority to medium |
| `priority_high` | Set selected tasks priority to high |

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "success": 5,
    "failed": 0
  }
}
```

**Response Fields**:
- `success`: Number of tasks successfully operated on
- `failed`: Number of tasks that failed

**Error Responses**:
- 400 Bad Request: Invalid operation or empty task_ids
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: `user_id` mismatch

---

## Authentication Endpoints

Authentication endpoints are handled by Better Auth. These endpoints do NOT require JWT authentication.

### 1. Sign Up

Create a new user account.

**Endpoint**: `POST /api/auth/sign-up`

**Authentication**: Not required

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Request Body Schema**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | Max 100 characters |
| `email` | string | Yes | Valid email, unique |
| `password` | string | Yes | Min 8 characters |

**Success Response** (201 Created):
```json
{
  "user": {
    "id": "uuid-string",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": false,
    "image": null,
    "createdAt": "2025-12-13T10:30:00Z",
    "updatedAt": "2025-12-13T10:30:00Z"
  },
  "session": {
    "id": "session-id",
    "userId": "uuid-string",
    "expiresAt": "2025-12-20T10:30:00Z",
    "token": "jwt-token-here"
  }
}
```

**Error Responses**:
- 400 Bad Request: Invalid input (email format, password too short, etc.)
- 409 Conflict: Email already exists

---

### 2. Sign In

Sign in with email and password.

**Endpoint**: `POST /api/auth/sign-in/email`

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Request Body Schema**:
| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |
| `password` | string | Yes |

**Success Response** (200 OK):
```json
{
  "user": {
    "id": "uuid-string",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": false,
    "image": null,
    "createdAt": "2025-12-13T10:30:00Z",
    "updatedAt": "2025-12-13T10:30:00Z"
  },
  "session": {
    "id": "session-id",
    "userId": "uuid-string",
    "expiresAt": "2025-12-20T10:30:00Z",
    "token": "jwt-token-here"
  }
}
```

**Error Responses**:
- 400 Bad Request: Missing email or password
- 401 Unauthorized: Invalid credentials

---

### 3. Sign Out

Sign out and invalidate current session.

**Endpoint**: `POST /api/auth/sign-out`

**Authentication**: Required (uses session cookie)

**Success Response** (200 OK):
```json
{
  "success": true
}
```

**Error Responses**:
- 401 Unauthorized: Not signed in

---

### 4. Get Session

Get current session information.

**Endpoint**: `GET /api/auth/session`

**Authentication**: Required (uses session cookie)

**Success Response** (200 OK):
```json
{
  "user": {
    "id": "uuid-string",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": false,
    "image": null,
    "createdAt": "2025-12-13T10:30:00Z",
    "updatedAt": "2025-12-13T10:30:00Z"
  },
  "session": {
    "id": "session-id",
    "userId": "uuid-string",
    "expiresAt": "2025-12-20T10:30:00Z",
    "token": "jwt-token-here"
  }
}
```

**Error Responses**:
- 401 Unauthorized: Not signed in or session expired

---

### 5. Get JWKS (JSON Web Key Set)

Get public keys for JWT verification (used by backend).

**Endpoint**: `GET /api/auth/jwks`

**Authentication**: Not required

**Success Response** (200 OK):
```json
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "key-id",
      "use": "sig",
      "alg": "RS256",
      "n": "public-key-modulus",
      "e": "public-key-exponent"
    }
  ]
}
```

**Note**: This endpoint is used by the backend to fetch public keys for JWT token verification.

---

## Related Specifications

- **@specs/features/authentication.md** - Authentication flow and JWT details
- **@specs/database/schema.md** - Database schema for tasks and auth tables
- **@specs/ui/components.md** - Frontend components that consume these APIs
- **@specs/architecture.md** - System architecture and API communication

---

## API Client Implementation

Frontend uses a centralized API client at `D:\Todo_giaic_five_phases\phase-2\frontend\lib\api.ts`:

```typescript
// Example usage
import { api } from "@/lib/api";

// Create task
const response = await api.createTask(userId, taskData);

// Get tasks with filters
const tasks = await api.getTasks(userId, {
  status: "pending",
  sort: "due_date:asc",
  page: 1,
  limit: 20
});

// Export tasks
await api.exportTasks(userId, "csv");
```

---

## Rate Limiting

**Not implemented in Phase II**

Future enhancement: Add rate limiting to prevent abuse
- Recommended: 100 requests per minute per user
- Use middleware like `slowapi` for FastAPI

---

## Versioning

**Current Version**: v1 (implicit, no version in URL)

Future enhancement: Add versioning to API URLs
- Example: `/api/v1/{user_id}/tasks`
- Allows breaking changes without affecting existing clients

---

## Testing

### Manual Testing

Use API documentation at `http://localhost:8000/docs` (Swagger UI) to test endpoints interactively.

### Automated Testing

Backend includes pytest tests for all endpoints:
- `D:\Todo_giaic_five_phases\phase-2\backend\tests\test_tasks.py`
- Run tests: `cd backend && uv run pytest`

---

## Conclusion

All API endpoints follow RESTful conventions, require JWT authentication (except auth endpoints), and enforce user isolation. The API provides comprehensive task management features including CRUD operations, filtering, sorting, search, pagination, import/export, and bulk operations.
