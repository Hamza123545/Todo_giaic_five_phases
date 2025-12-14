# Frontend Todo Application

A modern, responsive todo application built with Next.js 16+, TypeScript, and Tailwind CSS. Features include authentication, task management, real-time updates, offline support, and dark mode.

## ✅ Status: Phase 2 Complete

This frontend is fully functional and includes all required features for the full-stack todo web application.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Development Guide](#development-guide)
- [Testing](#testing)
- [Deployment](#deployment)
- [Accessibility](#accessibility)
- [Performance](#performance)
- [Security](#security)

## Features

### Core Features

- **Authentication**: Secure user signup/signin with JWT tokens via Better Auth
- **Task Management**: Create, read, update, and delete tasks with rich metadata
- **Filtering & Sorting**: Filter by status, priority, due date; Sort by multiple criteria
- **Real-time Search**: Instant search with debouncing across title and description
- **Dark Mode**: System-aware theme with manual toggle

### Advanced Features

- **Offline Support**: PWA with service workers for offline functionality
- **Drag & Drop**: Reorder tasks with smooth animations
- **Bulk Operations**: Select and modify multiple tasks at once
- **Export/Import**: CSV and JSON export/import capabilities
- **Undo/Redo**: Command pattern for reversible operations
- **Keyboard Shortcuts**: Productivity-focused keyboard navigation
- **Responsive Design**: Mobile-first design that adapts to all screen sizes

### UX Features

- **Loading States**: Skeleton screens and spinners during async operations
- **Error Handling**: User-friendly error messages with recovery actions
- **Optimistic Updates**: Instant UI feedback with server reconciliation
- **Accessibility**: WCAG 2.1 AA compliant with full keyboard navigation

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript 5+ (Strict mode)
- **Styling**: Tailwind CSS 4
- **Authentication**: Better Auth with JWT plugin
- **State Management**: React hooks (useState, useReducer, useContext)
- **Data Fetching**: Custom API client with fetch
- **Drag & Drop**: @dnd-kit/core
- **Icons**: Lucide React
- **Testing**: Jest + React Testing Library + Playwright
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel

## Prerequisites

- Node.js 20+ or later
- pnpm 9+ (recommended) or npm 10+
- Backend API running (see backend documentation)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd todo_console/phase-2/frontend
```

### 2. Install dependencies

```bash
pnpm install
# or
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the frontend directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration (see [Environment Variables](#environment-variables)).

⚠️ **Note**: `.env.local` files are gitignored. Never commit sensitive credentials.

### 4. Run the development server

```bash
pnpm run dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production

```bash
pnpm run build
pnpm run start
# or
npm run build
npm start
```

## Environment Variables

### Required Variables

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Better Auth Configuration
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-here
```

### Optional Variables

```bash
# Analytics (optional)
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
NEXT_PUBLIC_ENABLE_REAL_TIME_UPDATES=true
```

## Available Scripts

### Development

```bash
pnpm run dev          # Start development server (http://localhost:3000)
pnpm run build        # Create production build
pnpm run start        # Start production server
pnpm run lint         # Run ESLint
```

### Testing

```bash
pnpm run test              # Run unit tests
pnpm run test:watch        # Run tests in watch mode
pnpm run test:coverage     # Run tests with coverage
pnpm run test:ci           # Run tests in CI mode
pnpm run test:e2e          # Run end-to-end tests (Playwright)
```

## Project Structure

```
phase-2/frontend/
├── app/                      # Next.js App Router pages
│   ├── dashboard/            # Protected dashboard page
│   ├── signin/               # Sign-in page
│   ├── signup/               # Sign-up page
│   ├── layout.tsx            # Root layout with providers
│   └── page.tsx              # Home/landing page
├── components/               # Reusable React components
│   ├── __tests__/            # Component unit tests
│   ├── TaskForm.tsx          # Task create/edit form
│   ├── TaskItem.tsx          # Individual task display
│   ├── TaskList.tsx          # Task list container
│   ├── SearchBar.tsx         # Search input
│   ├── FilterControls.tsx    # Task filtering UI
│   └── ...                   # Other components
├── lib/                      # Utility libraries
│   ├── api.ts                # Centralized API client
│   ├── auth.ts               # Better Auth configuration
│   └── utils.ts              # Utility functions
├── types/                    # TypeScript type definitions
│   └── index.ts              # Shared types
├── hooks/                    # Custom React hooks
├── public/                   # Static assets
└── styles/                   # Global styles
```

## Development Guide

### Server vs Client Components

**Server Components (Default)**: Use for data fetching, static content, layouts

**Client Components**: Add `'use client'` for hooks, events, browser APIs

### API Integration

All API calls use the centralized API client at `/lib/api.ts`:

```typescript
import { api } from "@/lib/api";

// Get tasks
const tasks = await api.getTasks(userId, { status: "pending" });

// Create task
const newTask = await api.createTask(userId, { title: "New task" });
```

### Dark Mode Support

Use Tailwind's `dark:` variant on all colored elements:

```typescript
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  Content
</div>
```

### Keyboard Shortcuts

- `Ctrl/Cmd + K`: Focus search
- `Ctrl/Cmd + N`: New task
- `Escape`: Close modals
- `Delete`: Delete selected task

## Testing

### Unit Tests (Jest + React Testing Library)

```bash
pnpm run test              # Run all tests
pnpm run test:watch        # Watch mode
pnpm run test:coverage     # Coverage report
```

### E2E Tests (Playwright)

```bash
pnpm run test:e2e          # Run E2E tests
pnpm run test:e2e --ui     # UI mode
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to staging
vercel

# Deploy to production
vercel --prod
```

### Docker

```bash
docker build -t frontend-todo-app .
docker run -p 3000:3000 --env-file .env.production frontend-todo-app
```

## Accessibility

WCAG 2.1 AA compliant with:

- Semantic HTML
- ARIA labels and roles
- Keyboard navigation
- Focus indicators
- Color contrast ratios

## Performance

### Targets

- Lighthouse scores: >90 in all categories
- First Contentful Paint: <2s
- Largest Contentful Paint: <3s
- Cumulative Layout Shift: <0.1

### Optimizations

- Code splitting
- Image optimization
- Font optimization
- Bundle analysis
- Caching with service workers

## Security

- JWT authentication with httpOnly cookies
- HTTPS enforcement in production
- Content Security Policy headers
- Input sanitization
- XSS protection
- CSRF protection
- Regular dependency audits
