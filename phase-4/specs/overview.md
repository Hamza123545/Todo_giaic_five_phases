# Todo Full-Stack Web Application - Project Overview

## Project Information

**Project Name**: Todo Full-Stack Web Application
**Current Phase**: Phase III - AI-Powered Chatbot
**Version**: 3.0.0
**Status**: ✅ Complete

## Purpose

Build a modern, production-ready todo management web application that demonstrates full-stack development best practices, authentication, user isolation, AI-powered conversational interfaces, and advanced features like export/import, real-time updates, and offline support.

This project serves as a comprehensive learning resource for building full-stack web applications with Next.js and FastAPI, integrating AI agents via OpenAI Agents SDK and MCP (Model Context Protocol), following spec-driven development methodology.

## Current Phase: Phase III

**Objective**: Extend the Phase II web application with AI-powered conversational interface using OpenAI ChatKit, Agents SDK, and MCP server for natural language task management.

### Phase III Completion Status

All Phase III requirements have been successfully implemented:

#### ✅ AI Chatbot Features (All Complete)
- ✅ Natural language task creation via chat
- ✅ Natural language task listing and filtering
- ✅ Natural language task completion
- ✅ Natural language task deletion
- ✅ Natural language task updates
- ✅ Conversation context maintenance across sessions
- ✅ Dual conversation memory (SQLiteSession + PostgreSQL)
- ✅ Real-time streaming responses via Server-Sent Events (SSE)
- ✅ Multi-provider AI support (OpenAI, Gemini)

### Phase II Completion Status

All Phase II requirements remain functional:

#### ✅ Core Features (All Complete)
- ✅ Multi-user authentication with Better Auth
- ✅ JWT token-based authorization
- ✅ Task CRUD operations (Create, Read, Update, Delete)
- ✅ Task completion toggling
- ✅ User isolation at database and API levels

#### ✅ Advanced Features (All Complete)
- ✅ Task filtering by status, priority, due date, and tags
- ✅ Task sorting by date, title, priority, and update time
- ✅ Task search across title and description
- ✅ Pagination for large task lists
- ✅ Export tasks to CSV, JSON, and PDF
- ✅ Import tasks from CSV and JSON
- ✅ Drag-and-drop task reordering
- ✅ Bulk operations (delete, complete, priority changes)
- ✅ Task statistics dashboard
- ✅ Undo/redo functionality
- ✅ Real-time updates with polling
- ✅ Keyboard shortcuts

#### ✅ User Experience (All Complete)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark mode with system preference detection
- ✅ Loading states and skeleton screens
- ✅ Error handling with toast notifications
- ✅ Optimistic UI updates
- ✅ Offline functionality with PWA
- ✅ Touch-friendly mobile interactions
- ✅ WCAG 2.1 AA accessibility compliance

#### ✅ Technical Implementation (All Complete)
- ✅ Next.js 16+ App Router frontend
- ✅ FastAPI backend with SQLModel ORM
- ✅ Neon Serverless PostgreSQL database
- ✅ Better Auth authentication library
- ✅ JWT token verification on all API requests
- ✅ Tailwind CSS styling
- ✅ TypeScript strict mode
- ✅ Comprehensive error handling
- ✅ Docker containerization
- ✅ CI/CD pipelines with GitHub Actions

## Tech Stack Summary

### Frontend
- **Framework**: Next.js 16+ (App Router, TypeScript, React 19+)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Authentication**: Better Auth with JWT plugin
- **State Management**: React hooks (useState, useReducer, useContext)
- **Data Fetching**: Custom API client with fetch
- **Drag & Drop**: @dnd-kit/core
- **Icons**: Lucide React
- **Testing**: Jest, React Testing Library, Playwright

### Backend
- **Framework**: FastAPI (Python 3.13+)
- **ORM**: SQLModel (combines SQLAlchemy and Pydantic)
- **Database**: Neon Serverless PostgreSQL
- **Authentication**: JWT with Better Auth shared secret
- **AI Orchestration**: OpenAI Agents SDK (>=0.2.9)
- **MCP Server**: Official MCP Python SDK (>=1.0.0) with FastMCP
- **AI Providers**: OpenAI (gpt-4o), Gemini (via LiteLLM)
- **Conversation Memory**: SQLiteSession for ChatKit endpoint
- **Migrations**: Alembic
- **Testing**: pytest with httpx
- **Package Manager**: UV
- **Code Quality**: Black, Ruff

### Database
- **Primary**: Neon Serverless PostgreSQL
- **Shared Usage**: Both Better Auth (frontend) and FastAPI (backend) use the same database
- **Better Auth Tables**: Managed by Drizzle ORM
- **Application Tables**: Managed by SQLModel/Alembic migrations

### DevOps
- **Containerization**: Docker (backend and frontend Dockerfiles)
- **Orchestration**: docker-compose.yml for local development
- **CI/CD**: GitHub Actions workflows
- **Deployment**: Vercel (frontend), render.com or similar (backend API)

## Feature List

### 1. Authentication
- User signup with email and password
- User signin with email and password
- JWT token generation and management
- Token-based API authorization
- Secure password hashing
- Session management via cookies

### 2. Task Management
- Create tasks with title, description, priority, due date, tags
- View all tasks with pagination
- Update task details
- Delete tasks
- Toggle task completion status
- User isolation (users only see their own tasks)

### 3. Filtering and Sorting
- Filter by completion status (all, pending, completed)
- Filter by priority (low, medium, high)
- Filter by due date range
- Filter by tags
- Sort by creation date, title, update time, priority, due date
- Search across task title and description

### 4. Import/Export
- Export tasks to CSV format
- Export tasks to JSON format
- Export tasks to PDF format
- Import tasks from CSV files
- Import tasks from JSON files
- Validation and error reporting during import

### 5. Advanced UI Features
- Drag-and-drop task reordering
- Bulk operations (select multiple tasks)
- Undo/redo with command pattern
- Task statistics dashboard
- Multiple view modes (list, grid, kanban)
- Inline task editing
- Real-time updates with polling
- Keyboard shortcuts for productivity

### 6. User Experience
- Responsive design for all screen sizes
- Dark mode with toggle and system preference detection
- Loading states and skeleton screens
- Error handling with user-friendly messages
- Toast notifications for feedback
- Optimistic UI updates
- Offline support with service workers (PWA)
- Touch-friendly mobile interactions
- Full keyboard navigation
- WCAG 2.1 AA accessibility compliance

## Project Status

### Phase I (Console Application) - ✅ Complete
- Command-line interface for task management
- In-memory storage
- Basic CRUD operations
- Single-user experience

### Phase II (Web Application) - ✅ Complete
- Multi-user web application
- Authentication and authorization
- Persistent database storage
- RESTful API backend
- Responsive frontend
- Advanced features (export/import, search, filtering, etc.)
- Production-ready deployment

### Phase III (AI Chatbot) - ✅ Complete
- ✅ Natural language task management (add, list, complete, delete, update)
- ✅ Conversational interface with OpenAI ChatKit widget
- ✅ AI agent with OpenAI Agents SDK
- ✅ MCP server with 5 task management tools
- ✅ Conversation context maintenance with SQLiteSession
- ✅ Dual conversation persistence (SQLiteSession + PostgreSQL)
- ✅ Real-time streaming responses via Server-Sent Events
- ✅ Multi-provider support (OpenAI gpt-4o, Gemini via LiteLLM)
- ✅ JWT authentication integration
- ✅ User isolation at conversation and task levels

## Repository Structure

```
phase-3/
├── .spec-kit/
│   └── config.yaml                # Spec-Kit configuration
├── specs/                         # Specifications
│   ├── overview.md                # This file
│   ├── architecture.md            # System architecture
│   ├── features/                  # Feature specs
│   │   ├── task-crud.md
│   │   ├── authentication.md
│   │   └── ai-chatbot.md          # NEW: AI chatbot feature
│   ├── api/                       # API specs
│   │   └── rest-endpoints.md
│   ├── database/                  # Database specs
│   │   └── schema.md
│   └── ui/                        # UI specs
│       ├── components.md
│       └── pages.md
├── frontend/                      # Next.js application
│   ├── CLAUDE.md                  # Frontend guidelines
│   ├── app/                       # App Router pages
│   │   ├── chat/                  # NEW: Chat page
│   │   └── ...
│   ├── components/                # React components
│   │   ├── chatkit/               # NEW: ChatKit widget
│   │   └── ...
│   └── lib/                       # Utilities and API client
├── backend/                       # FastAPI application
│   ├── CLAUDE.md                  # Backend guidelines
│   ├── main.py                    # Entry point
│   ├── models/                    # Database models
│   │   ├── conversation.py        # NEW: Conversation model
│   │   ├── message.py             # NEW: Message model
│   │   └── task.py
│   ├── routers/                   # API routes
│   │   ├── chat.py                # NEW: Chat endpoint
│   │   ├── chatkit.py             # NEW: ChatKit endpoint
│   │   └── tasks.py
│   ├── services/                  # Business logic
│   │   ├── chatkit_server.py      # NEW: ChatKit server
│   │   ├── conversation_service.py # NEW: Conversation service
│   │   └── task_service.py
│   ├── agent_config/              # NEW: AI agent configuration
│   │   ├── factory.py             # Model factory
│   │   └── todo_agent.py          # TodoAgent definition
│   ├── mcp_server/                # NEW: MCP server
│   │   ├── __init__.py
│   │   ├── __main__.py            # Entry point: python -m mcp_server
│   │   └── tools.py               # 5 MCP tools with @mcp.tool()
│   └── middleware/                # Middleware
├── CLAUDE.md                      # Root-level guide
├── docker-compose.yml             # Docker orchestration
└── README.md                      # Project documentation
```

## Key Specifications

- **`@specs/architecture.md`** - System architecture, authentication flow, API communication
- **`@specs/features/task-crud.md`** - Task CRUD operations specification
- **`@specs/features/authentication.md`** - Authentication and JWT flow
- **`@specs/api/rest-endpoints.md`** - Complete API endpoint documentation
- **`@specs/database/schema.md`** - Database schema and relationships
- **`@specs/ui/components.md`** - React component library
- **`@specs/ui/pages.md`** - Next.js pages and routing

## Development Approach

This project follows **Spec-Driven Development (SDD)** methodology:

1. **Specification First**: All features are specified in `/specs` before implementation
2. **Architecture Planning**: System design documented in `@specs/architecture.md`
3. **Implementation**: Code follows specifications exactly
4. **Testing**: Comprehensive tests verify spec compliance
5. **Iteration**: Specs updated if requirements change

## Phase III Implementation Highlights

### MCP Server Architecture
- **Location**: `backend/mcp_server/` (renamed from `mcp/` to avoid package shadowing)
- **Framework**: Official MCP Python SDK with FastMCP
- **Tools**: 5 tools decorated with `@mcp.tool()` (add_task, list_tasks, complete_task, delete_task, update_task)
- **Connection**: stdio transport via MCPServerStdio
- **Lifecycle**: Managed by async context manager (`async with mcp_server:`)
- **Entry Point**: `python -m mcp_server`

### AI Agent Configuration
- **Agent SDK**: OpenAI Agents SDK (agents package)
- **Connection**: MCPServerStdio for connecting to MCP server
- **Model Factory**: Supports OpenAI (gpt-4o) and Gemini (via LiteLLM)
- **Instructions**: Comprehensive system prompt for conversational task management
- **Streaming**: Token-by-token response streaming via Runner.run_streamed()

### Conversation Memory
- **Dual Architecture**:
  - **ChatKit Endpoint**: SQLiteSession for automatic conversation history management
  - **Direct REST Endpoint**: PostgreSQL database persistence
- **Session Isolation**: Unique session IDs per user+thread combination
- **Persistence**: Survives server restarts (SQLiteSession stored in SQLite database)
- **Stateless Server**: No in-memory state, all conversation data in database

### Frontend Integration
- **Widget**: OpenAI ChatKit (@openai/chatkit-react)
- **Authentication**: JWT token from Better Auth attached to requests
- **Streaming**: Real-time SSE response display
- **API Endpoint**: `/api/chatkit` for ChatKit widget, `/api/{user_id}/chat` for direct access

## Next Steps

For Phase IV (Advanced AI Features), the following features are planned:
- Voice input for task creation
- AI-powered task suggestions based on user patterns
- Smart reminders and notifications
- External calendar integration (Google Calendar, Outlook)
- Multi-modal input (images, files, voice)

## References

- Root Guide: `@CLAUDE.md`
- Frontend Guide: `@frontend/CLAUDE.md`
- Backend Guide: `@backend/CLAUDE.md`
- Constitution: `.specify/memory/constitution.md`
