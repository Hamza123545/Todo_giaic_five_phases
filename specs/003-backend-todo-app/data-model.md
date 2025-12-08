# Data Model: Backend Todo Application

**Date**: 2025-12-08 | **Feature**: 003-backend-todo-app | **Input**: spec.md, research.md

## Overview

This document defines the data models for the backend todo application, including entities, relationships, and constraints. The models follow the requirements specified in the feature specification and align with the architectural decisions made in the research phase.

## Entity Models

### User Entity

**Description**: Represents a registered user in the system with authentication details.

**Fields**:
- `id` (string, UUID, primary key) - Unique identifier for user
- `email` (string, unique, required, max 255 characters) - User's email address
- `password_hash` (string, required) - Securely hashed password using bcrypt
- `name` (string, required, max 100 characters) - User's display name
- `created_at` (datetime, auto-generated) - Account creation timestamp
- `updated_at` (datetime, auto-updated) - Last update timestamp

**Constraints**:
- Email must be unique across all users
- Email must follow standard email format validation
- Password must be securely hashed before storage
- Name must be between 1 and 100 characters

**Indexes**:
- Primary key index on `id`
- Unique index on `email`

### Task Entity

**Description**: Represents a task created by a user with various properties for organization and tracking.

**Fields**:
- `id` (integer, primary key, auto-increment) - Unique identifier for task
- `user_id` (string, UUID, foreign key to users table, required) - Owner of the task
- `title` (string, required, max 200 characters) - Task title
- `description` (text, optional, max 1000 characters) - Task description
- `priority` (string, enum: 'low'|'medium'|'high', required, default 'medium') - Task priority level
- `due_date` (datetime, optional) - Due date for task completion
- `tags` (JSON array of strings, optional) - Tags for task categorization
- `completed` (boolean, default false) - Completion status
- `created_at` (datetime, auto-generated) - Task creation timestamp
- `updated_at` (datetime, auto-updated) - Last update timestamp

**Constraints**:
- Task must belong to a valid user (foreign key constraint)
- Title must be between 1 and 200 characters
- Description can be up to 1000 characters if provided
- Priority must be one of 'low', 'medium', or 'high'
- Tags must be a valid JSON array of strings
- Completed defaults to false when creating new tasks

**Indexes**:
- Primary key index on `id`
- Index on `user_id` for efficient user isolation queries
- Index on `completed` for status filtering
- Index on `priority` for priority-based queries
- Index on `due_date` for date-based queries and sorting

### Session Entity (Optional JWT Tracking)

**Description**: Tracks active JWT sessions for potential session management features (though JWTs are typically stateless).

**Fields**:
- `id` (string, UUID, primary key) - Unique identifier for session
- `token` (string, JWT token) - JWT token value (encrypted for security)
- `user_id` (string, UUID, foreign key to users table) - Associated user
- `expires_at` (datetime) - Token expiration time
- `created_at` (datetime, auto-generated) - Session creation time

**Constraints**:
- Session must belong to a valid user (foreign key constraint)
- Token must be unique within active sessions
- Expires_at must be in the future when created

**Indexes**:
- Primary key index on `id`
- Index on `user_id` for user-specific queries
- Index on `expires_at` for cleanup operations

## Entity Relationships

### User-Task Relationship
- **Type**: One-to-Many (One user can have many tasks)
- **Cardinality**: 1:N
- **Relationship**: `User.id` → `Task.user_id`
- **Constraint**: Foreign key constraint enforces referential integrity
- **Behavior**: Tasks are deleted when user is deleted (CASCADE delete)

### User-Session Relationship (Optional)
- **Type**: One-to-Many (One user can have many sessions)
- **Cardinality**: 1:N
- **Relationship**: `User.id` → `Session.user_id`
- **Constraint**: Foreign key constraint enforces referential integrity
- **Behavior**: Sessions are deleted when user is deleted (CASCADE delete)

## Database Schema (SQLModel Implementation)

```python
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
import uuid

# Forward declaration for relationship
class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: int = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", nullable=False)
    title: str = Field(max_length=200, nullable=False)
    description: Optional[str] = Field(max_length=1000, default=None)
    priority: str = Field(default="medium", sa_column_kwargs={"server_default": "medium"})
    due_date: Optional[datetime] = Field(default=None)
    tags: Optional[str] = Field(default=None)  # Stored as JSON string
    completed: bool = Field(default=False, sa_column_kwargs={"server_default": "false"})
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})

    # Relationship to user
    user: "User" = Relationship(back_populates="tasks")

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    email: str = Field(unique=True, max_length=255, nullable=False)
    password_hash: str = Field(nullable=False)
    name: str = Field(max_length=100, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})

    # Relationship to tasks
    tasks: List[Task] = Relationship(back_populates="user")
```

## Index Specifications

### Required Database Indexes
Based on the constitution requirements and performance considerations:

1. **tasks.user_id** (for filtering by user)
   - Purpose: Efficient user isolation queries
   - Type: B-tree index
   - Performance: Critical for multi-user security

2. **tasks.completed** (for status filtering)
   - Purpose: Efficient filtering by completion status
   - Type: B-tree index
   - Performance: Critical for task status queries

3. **tasks.priority** (for priority filtering)
   - Purpose: Efficient filtering by priority level
   - Type: B-tree index
   - Performance: Important for priority-based sorting

4. **tasks.due_date** (for due date filtering and sorting)
   - Purpose: Efficient date-based queries and sorting
   - Type: B-tree index
   - Performance: Important for deadline tracking

5. **users.email** (unique index)
   - Purpose: Enforce unique email constraint and fast lookups
   - Type: Unique B-tree index
   - Performance: Critical for authentication queries

## Data Validation Rules

### User Validation
- Email format must follow RFC 5322 standard
- Password must be securely hashed before storage
- Name must be 1-100 characters
- Email must be unique across all users

### Task Validation
- Title must be 1-200 characters
- Description must be 0-1000 characters if provided
- Priority must be 'low', 'medium', or 'high'
- Due date must be a valid date if provided
- Tags must be a valid JSON array of strings
- User_id must reference an existing user

### Security Validation
- All queries must be filtered by authenticated user's ID
- User isolation must be enforced at both API and database levels
- Input sanitization must be applied to prevent injection attacks

## Migration Considerations

### Initial Schema Migration
- Create users table with all required fields and indexes
- Create tasks table with all required fields and indexes
- Establish foreign key relationships
- Set up proper constraints and defaults

### Future Migration Support
- Use Alembic for database migration management
- Maintain backward compatibility during schema changes
- Implement proper seed data for initial deployment
- Plan for data migration during schema evolution

## Performance Considerations

### Query Optimization
- Use indexes for all frequently queried fields
- Implement pagination for large result sets
- Consider read replicas for heavy read operations
- Monitor query performance with EXPLAIN ANALYZE

### Storage Optimization
- Use appropriate data types for efficient storage
- Consider partitioning for very large datasets
- Implement proper archiving for old data
- Optimize JSON storage for tags field

This data model provides a solid foundation for the backend application while meeting all the requirements specified in the feature specification and constitution.