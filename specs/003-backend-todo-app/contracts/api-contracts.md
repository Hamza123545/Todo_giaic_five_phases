# API Contracts: Backend Todo Application

**Date**: 2025-12-08 | **Feature**: 003-backend-todo-app | **Input**: spec.md, plan.md

## Overview

This document defines the API contracts for the backend todo application. These contracts specify the exact interface between the frontend and backend, including request/response formats, HTTP status codes, and authentication requirements.

## Base Configuration

### Base URL
- **Development**: `http://localhost:8000`
- **Production**: Environment-specific (configured via environment variables)

### API Prefix
All endpoints use the `/api/` prefix

### Authentication
- All endpoints require JWT token in Authorization header: `Authorization: Bearer <token>`
- Exception: Authentication endpoints (`/api/auth/*`) which issue tokens

### Content Type
- Request/Response: `application/json` (except multipart for file uploads)

## Authentication Endpoints

### POST /api/auth/signup
**Description**: Create new user account

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response (Success - 201)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid-string",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2023-12-08T10:00:00Z",
      "updated_at": "2023-12-08T10:00:00Z"
    }
  }
}
```

**Response (Validation Error - 400)**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Email format is invalid",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

**Response (Conflict - 409)**:
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "Email already registered"
  }
}
```

### POST /api/auth/signin
**Description**: Authenticate user and return JWT token

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid-string",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2023-12-08T10:00:00Z",
      "updated_at": "2023-12-08T10:00:00Z"
    }
  }
}
```

**Response (Unauthorized - 401)**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

### POST /api/auth/signout
**Description**: Sign out user (invalidate session if applicable)

**Request**:
```json
{}
```
**Headers**: `Authorization: Bearer <token>`

**Response (Success - 200)**:
```json
{
  "success": true
}
```

**Response (Unauthorized - 401)**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

## Task Management Endpoints

### GET /api/{user_id}/tasks
**Description**: List all tasks with filtering, sorting, search, and pagination

**Query Parameters**:
- `status`: "all"|"pending"|"completed" (default: "all")
- `priority`: "low"|"medium"|"high" (optional)
- `due_date`: "YYYY-MM-DD" (optional)
- `tags`: comma-separated tags (optional)
- `search`: keyword to search in title/description (optional)
- `sort`: "created"|"title"|"updated"|"priority"|"due_date" (default: "created")
- `direction`: "asc"|"desc" (default: "desc")
- `page`: page number (default: 1)
- `limit`: items per page (default: 20)

**Headers**: `Authorization: Bearer <token>`

**Response (Success - 200)**:
```json
{
  "data": [
    {
      "id": 1,
      "user_id": "user-uuid-string",
      "title": "Sample Task",
      "description": "This is a sample task",
      "priority": "medium",
      "due_date": "2023-12-31T23:59:59Z",
      "tags": ["work", "important"],
      "completed": false,
      "created_at": "2023-12-08T10:00:00Z",
      "updated_at": "2023-12-08T10:00:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  },
  "success": true
}
```

**Response (Unauthorized - 401)**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

**Response (Forbidden - 403)**:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN_ACCESS",
    "message": "User ID in token does not match URL path"
  }
}
```

### POST /api/{user_id}/tasks
**Description**: Create new task

**Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request**:
```json
{
  "title": "New Task",
  "description": "Task description (optional)",
  "priority": "medium",
  "due_date": "2023-12-31T23:59:59Z",
  "tags": ["tag1", "tag2"]
}
```

**Response (Success - 201)**:
```json
{
  "data": {
    "id": 1,
    "user_id": "user-uuid-string",
    "title": "New Task",
    "description": "Task description (optional)",
    "priority": "medium",
    "due_date": "2023-12-31T23:59:59Z",
    "tags": ["tag1", "tag2"],
    "completed": false,
    "created_at": "2023-12-08T10:00:00Z",
    "updated_at": "2023-12-08T10:00:00Z"
  },
  "success": true
}
```

**Response (Validation Error - 400)**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid task data",
    "details": {
      "title": "Title is required and must be 1-200 characters"
    }
  }
}
```

### GET /api/{user_id}/tasks/{id}
**Description**: Get task details

**Headers**: `Authorization: Bearer <token>`

**Response (Success - 200)**:
```json
{
  "data": {
    "id": 1,
    "user_id": "user-uuid-string",
    "title": "Sample Task",
    "description": "This is a sample task",
    "priority": "medium",
    "due_date": "2023-12-31T23:59:59Z",
    "tags": ["work", "important"],
    "completed": false,
    "created_at": "2023-12-08T10:00:00Z",
    "updated_at": "2023-12-08T10:00:00Z"
  },
  "success": true
}
```

**Response (Not Found - 404)**:
```json
{
  "success": false,
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task not found"
  }
}
```

### PUT /api/{user_id}/tasks/{id}
**Description**: Update task

**Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request**:
```json
{
  "title": "Updated Task Title",
  "description": "Updated description",
  "priority": "high",
  "due_date": "2023-12-31T23:59:59Z",
  "tags": ["updated", "important"]
}
```

**Response (Success - 200)**:
```json
{
  "data": {
    "id": 1,
    "user_id": "user-uuid-string",
    "title": "Updated Task Title",
    "description": "Updated description",
    "priority": "high",
    "due_date": "2023-12-31T23:59:59Z",
    "tags": ["updated", "important"],
    "completed": false,
    "created_at": "2023-12-08T10:00:00Z",
    "updated_at": "2023-12-08T11:00:00Z"
  },
  "success": true
}
```

### DELETE /api/{user_id}/tasks/{id}
**Description**: Delete task

**Headers**: `Authorization: Bearer <token>`

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

### PATCH /api/{user_id}/tasks/{id}/complete
**Description**: Toggle task completion status

**Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request**:
```json
{
  "completed": true
}
```

**Response (Success - 200)**:
```json
{
  "data": {
    "id": 1,
    "user_id": "user-uuid-string",
    "title": "Sample Task",
    "description": "This is a sample task",
    "priority": "medium",
    "due_date": "2023-12-31T23:59:59Z",
    "tags": ["work", "important"],
    "completed": true,
    "created_at": "2023-12-08T10:00:00Z",
    "updated_at": "2023-12-08T11:00:00Z"
  },
  "success": true
}
```

## Advanced Feature Endpoints

### GET /api/{user_id}/tasks/export
**Description**: Export tasks to CSV or JSON format

**Query Parameters**:
- `format`: "csv"|"json" (default: "json")

**Headers**: `Authorization: Bearer <token>`

**Response (Success - 200)**:
- Returns file download with appropriate content-type

**Response (Forbidden - 403)**:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN_ACCESS",
    "message": "User ID in token does not match URL path"
  }
}
```

### POST /api/{user_id}/tasks/import
**Description**: Import tasks from CSV or JSON file

**Headers**: `Authorization: Bearer <token>`

**Request**: `multipart/form-data` with file upload

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "imported": 5,
    "errors": 0,
    "errors_list": []
  }
}
```

**Response (Bad Request - 400)**:
```json
{
  "success": false,
  "error": {
    "code": "IMPORT_ERROR",
    "message": "Invalid file format or content",
    "details": "File must be CSV or JSON format"
  }
}
```

### GET /api/{user_id}/tasks/statistics
**Description**: Get task statistics

**Headers**: `Authorization: Bearer <token>`

**Response (Success - 200)**:
```json
{
  "data": {
    "total": 10,
    "completed": 3,
    "pending": 7,
    "overdue": 2
  },
  "success": true
}
```

### POST /api/{user_id}/tasks/bulk
**Description**: Perform bulk operations on tasks

**Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request**:
```json
{
  "action": "complete",
  "task_ids": [1, 2, 3],
  "priority": "high"
}
```

**Valid actions**: "delete", "complete", "pending", "priority"

**Response (Success - 200)**:
```json
{
  "success": true,
  "data": {
    "affected": 3
  }
}
```

## Error Response Format

All error responses follow this standard format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional field with specific error details
  }
}
```

### Standard Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `UNAUTHORIZED`: Invalid or missing authentication
- `FORBIDDEN_ACCESS`: Access denied to resource
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server-side error
- `DUPLICATE_RESOURCE`: Resource already exists
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `IMPORT_ERROR`: File import failed

## Success Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "data": {}, // Optional - response data if applicable
  "message": "Optional success message" // Optional
}
```

## Security Requirements

1. All endpoints (except auth) require valid JWT token
2. User ID in JWT must match user_id in URL path
3. All requests are logged for security monitoring
4. Rate limiting applied to prevent abuse
5. Input validation on all fields to prevent injection