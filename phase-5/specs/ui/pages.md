# UI Pages Specification

**Status**: Implemented
**Version**: 1.0
**Last Updated**: 2025-12-13

## Overview

Phase II includes 4 main pages using **Next.js 16 App Router**. Pages are organized in the `app/` directory following App Router conventions.

## Table of Contents

1. [Page Architecture](#page-architecture)
2. [Landing Page](#landing-page)
3. [Sign In Page](#sign-in-page)
4. [Sign Up Page](#sign-up-page)
5. [Dashboard Page](#dashboard-page)
6. [Route Protection](#route-protection)
7. [Layouts](#layouts)
8. [Data Fetching](#data-fetching)
9. [Related Specifications](#related-specifications)

---

## Page Architecture

### Next.js 16 App Router

**Directory**: `D:\Todo_giaic_five_phases\phase-2\frontend\app\`

**Structure**:
```
app/
├── layout.tsx              # Root layout (all pages)
├── page.tsx                # Landing page (/)
├── signin/
│   └── page.tsx            # Sign in page (/signin)
├── signup/
│   └── page.tsx            # Sign up page (/signup)
└── dashboard/
    └── page.tsx            # Dashboard page (/dashboard)
```

### Routing Conventions

| Route | File | Access |
|-------|------|--------|
| `/` | `app/page.tsx` | Public |
| `/signin` | `app/signin/page.tsx` | Public |
| `/signup` | `app/signup/page.tsx` | Public |
| `/dashboard` | `app/dashboard/page.tsx` | Protected |

---

## Landing Page

### Route: `/`

**File**: `D:\Todo_giaic_five_phases\phase-2\frontend\app\page.tsx`

**Type**: Public (no authentication required)

**Purpose**: Marketing landing page to introduce the app and encourage signups

### Features

1. **Navigation Bar** (`LandingNavbar`):
   - Logo
   - Navigation links (Features, How It Works, Pricing)
   - Sign In button (→ `/signin`)
   - Sign Up button (→ `/signup`)
   - Mobile menu toggle

2. **Hero Section** (`LandingHero`):
   - Headline: "Manage Your Tasks Efficiently"
   - Subheadline: "Stay organized and productive with our powerful task management tool"
   - CTA: "Get Started" button (→ `/signup`)
   - Hero illustration/image

3. **Features Section** (`LandingFeatures`):
   - Feature grid (3 columns on desktop, 1 on mobile)
   - Features:
     - Task Management: Create, edit, delete tasks
     - Filtering & Sorting: Find tasks quickly
     - Export/Import: CSV, JSON, PDF support
     - Dark Mode: Eye-friendly interface
     - Offline Support: PWA capabilities
     - Responsive Design: Works on all devices

4. **How It Works Section** (`LandingHowItWorks`):
   - Step 1: Sign up for free
   - Step 2: Create your first task
   - Step 3: Stay organized and productive

5. **Footer** (`LandingFooter`):
   - Social links (GitHub, Twitter)
   - Copyright notice
   - Privacy Policy (placeholder)
   - Terms of Service (placeholder)

### Components Used

- `LandingNavbar`
- `LandingHero`
- `LandingFeatures`
- `LandingHowItWorks`
- `LandingFooter`

### Redirects

- If user is already authenticated, redirect to `/dashboard`

### Code Structure

```tsx
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingNavbar />
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingFooter />
    </div>
  );
}
```

---

## Sign In Page

### Route: `/signin`

**File**: `D:\Todo_giaic_five_phases\phase-2\frontend\app\signin\page.tsx`

**Type**: Public (no authentication required)

**Purpose**: Authenticate existing users

### Features

1. **Sign In Form**:
   - Email input (required, email format validation)
   - Password input (required, min 8 characters)
   - "Remember me" checkbox (optional)
   - Submit button ("Sign In")
   - Loading state during authentication

2. **Error Handling**:
   - Display error messages inline
   - Handle invalid credentials
   - Handle server errors

3. **Navigation**:
   - "Don't have an account? Sign up" link (→ `/signup`)
   - "Forgot password?" link (placeholder, not implemented in Phase II)

4. **Redirects**:
   - On successful signin → `/dashboard`
   - If already authenticated → `/dashboard`

### Form Validation

**Client-Side**:
- Email: Required, valid email format
- Password: Required, min 8 characters

**Server-Side** (via Better Auth):
- Credentials validation
- Account existence check

### API Integration

**Endpoint**: `POST /api/auth/sign-in/email`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (Success):
```json
{
  "user": { ... },
  "session": { ... }
}
```

**Response** (Error):
```json
{
  "error": "Invalid credentials"
}
```

### Components Used

- Better Auth sign-in form (built-in or custom)
- `LoadingSpinner` (during authentication)
- `ErrorDisplay` (for error messages)
- `Button` (shadcn/ui)

### Code Structure

```tsx
"use client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signIn.email({ email, password });
      router.push("/dashboard");
    } catch (err) {
      setError("Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>
    </div>
  );
}
```

---

## Sign Up Page

### Route: `/signup`

**File**: `D:\Todo_giaic_five_phases\phase-2\frontend\app\signup\page.tsx`

**Type**: Public (no authentication required)

**Purpose**: Register new users

### Features

1. **Sign Up Form**:
   - Name input (required, max 100 characters)
   - Email input (required, email format validation, unique)
   - Password input (required, min 8 characters)
   - Confirm password input (must match password)
   - Submit button ("Sign Up")
   - Loading state during registration

2. **Error Handling**:
   - Display validation errors inline
   - Handle duplicate email (409 Conflict)
   - Handle server errors

3. **Navigation**:
   - "Already have an account? Sign in" link (→ `/signin`)

4. **Redirects**:
   - On successful signup → Auto signin → `/dashboard`
   - If already authenticated → `/dashboard`

### Form Validation

**Client-Side**:
- Name: Required, max 100 characters
- Email: Required, valid email format
- Password: Required, min 8 characters
- Confirm Password: Required, must match password

**Server-Side** (via Better Auth):
- Email uniqueness check
- Password strength validation

### API Integration

**Endpoint**: `POST /api/auth/sign-up`

**Request**:
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (Success):
```json
{
  "user": { ... },
  "session": { ... }
}
```

**Response** (Error):
```json
{
  "error": "Email already exists"
}
```

### Components Used

- Better Auth sign-up form (built-in or custom)
- `LoadingSpinner` (during registration)
- `ErrorDisplay` (for error messages)
- `Button` (shadcn/ui)

### Code Structure

```tsx
"use client";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await signUp.email({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      router.push("/dashboard");
    } catch (err) {
      setError("Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>
    </div>
  );
}
```

---

## Dashboard Page

### Route: `/dashboard`

**File**: `D:\Todo_giaic_five_phases\phase-2\frontend\app\dashboard\page.tsx`

**Type**: Protected (authentication required)

**Purpose**: Main task management interface

### Route Protection

**Wrapper**: `ProtectedRoute` component

```tsx
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

**Protection Mechanism**:
1. `ProtectedRoute` checks for active session via `getCurrentUser()`
2. If no session, redirects to `/signin`
3. If session exists, renders `DashboardContent`

### Features

#### 1. Header Section (`DashboardHeader`)

- User name display: "Welcome back, [Name]!"
- Sign out button
- Dark mode toggle
- PWA install button

#### 2. Welcome Section

- Personalized greeting: "Welcome back, John! 👋"
- Subtitle: "Manage your tasks and stay productive"

#### 3. Task Creation Section

- **Collapsed State** (default):
  - "Quick Add Task" heading
  - "Add Task" button (opens form)
  - Placeholder UI

- **Expanded State**:
  - "Create New Task" heading
  - Full task form (`TaskForm`)
  - Cancel button (collapses form)

#### 4. Task List Section

- **Controls Row**:
  - Heading: "Your Tasks"
  - Task count: "42 tasks total"
  - Real-time updates indicator (live/off toggle)
  - Filter controls (All, Pending, Completed)
  - Sort controls (Created, Title, Priority, Due Date)

- **Search Bar**:
  - Search input with debounce
  - PWA install button (if not installed)

- **Task List** (`TaskList`):
  - List/Grid/Kanban view modes
  - Tasks displayed with `TaskItem` components
  - Drag-and-drop reordering
  - Loading skeleton while fetching
  - Empty state placeholder

- **Pagination Controls**:
  - Page navigation (Previous/Next)
  - Page number buttons
  - Items per page dropdown (10, 20, 50, 100)

#### 5. Statistics Sidebar (Right Column)

- **Statistics Card**:
  - Total tasks count
  - Pending tasks count
  - Completed tasks count
  - Animated numbers on update

- **Quick Actions Card**:
  - Export dropdown (CSV, JSON, PDF)
  - Import tasks button
  - Clear completed button

- **View Options Card**:
  - List view button
  - Grid view button
  - Kanban view button

### Layout

**Grid Layout** (Desktop):
- Left column (2/3 width): Task creation + Task list
- Right column (1/3 width): Statistics + Quick actions + View options

**Stack Layout** (Mobile):
- All sections stacked vertically

### State Management

**Local State** (React hooks):
- `user`: Current authenticated user
- `tasks`: Array of tasks
- `filter`: Current filter ("all" | "pending" | "completed")
- `sortConfig`: Sort key and direction
- `searchQuery`: Search input value
- `currentPage`: Pagination page number
- `itemsPerPage`: Items per page
- `isTaskFormOpen`: Task form visibility
- `pollingEnabled`: Real-time updates toggle
- `viewMode`: View mode ("list" | "grid" | "kanban")

### Data Fetching

**Initial Load**:
1. Load user via `getCurrentUser()`
2. Load tasks via `api.getTasks(userId, queryParams)`

**Query Parameters**:
```typescript
{
  status: filter,
  sort: `${sortKey}:${direction}`,
  search: searchQuery,
  page: currentPage,
  limit: itemsPerPage
}
```

**Real-Time Updates** (Polling):
- Poll every 5 seconds (configurable)
- Silent refresh (no loading spinner)
- Can be toggled on/off

### Event Handlers

**Task Events**:
- `handleTaskCreated`: Reload tasks after creation
- `handleTaskUpdated`: Reload tasks after update
- `handleTaskDeleted`: Reload tasks after deletion
- `handleTaskError`: Display error toast

**Filter/Sort/Search**:
- `handleFilterChange`: Update filter, reset to page 1
- `handleSortChange`: Update sort config, reset to page 1
- `handleSearchChange`: Update search query, reset to page 1

**Pagination**:
- `handlePageChange`: Change page number
- `handleItemsPerPageChange`: Change items per page, reset to page 1

**Import/Export**:
- `handleImportTasks`: Open file picker, upload file, reload tasks
- `handleClearCompleted`: Delete all completed tasks, reload

**Sign Out**:
- `handleSignOut`: Sign out via Better Auth, redirect to `/signin`

### Components Used

- `ProtectedRoute` (wrapper)
- `DashboardHeader`
- `TaskForm`
- `TaskList`
  - `TaskItem` (individual tasks)
  - `SortableTaskItem` (draggable tasks)
- `FilterControls`
- `SortControls`
- `SearchBar`
- `PaginationControls`
- `TaskStatistics`
- `ExportDropdown`
- `PWAInstallButton`
- `KeyboardShortcuts`
- `LoadingSpinner`
- `SkeletonLoader`

### Keyboard Shortcuts

- `Ctrl/Cmd + K`: Focus search bar
- `Ctrl/Cmd + N`: Open task form
- `Esc`: Close task form/modal

### Responsive Design

**Desktop** (lg: 1024px+):
- 3-column grid layout
- All features visible

**Tablet** (md: 768px+):
- 2-column layout
- Sidebar below main content

**Mobile** (sm: 640px):
- Single column stack
- Collapsible sections
- Touch-friendly buttons

### Code Structure

```tsx
"use client";

function DashboardContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "created",
    direction: "desc",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  // Load tasks when filters change
  useEffect(() => {
    if (user) {
      loadTasks(user.id);
    }
  }, [user, filter, sortConfig, searchQuery, currentPage, itemsPerPage]);

  // Polling for real-time updates
  usePolling(async () => {
    if (user) {
      await loadTasks(user.id, true); // Silent refresh
    }
  }, { interval: 5000, enabled: pollingEnabled });

  return (
    <div className="min-h-screen">
      <DashboardHeader user={user} onSignOut={handleSignOut} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <h1>Welcome back, {user?.name}! 👋</h1>

        {/* Grid Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Task Creation + List */}
          <div className="lg:col-span-2">
            {/* Task Creation */}
            <TaskForm userId={user?.id} onSuccess={handleTaskCreated} />

            {/* Task List */}
            <div>
              <div className="flex justify-between">
                <FilterControls filter={filter} onFilterChange={handleFilterChange} />
                <SortControls sortConfig={sortConfig} onSortChange={handleSortChange} />
              </div>
              <SearchBar onSearch={handleSearchChange} />
              <TaskList tasks={tasks} userId={user?.id} onTaskChange={handleTaskUpdated} />
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>

          {/* Right Column: Statistics + Actions */}
          <div>
            <TaskStatistics userId={user?.id} />
            <ExportDropdown userId={user?.id} />
            {/* View options */}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

---

## Route Protection

### Protected Routes

**Routes**:
- `/dashboard`

**Protection Method**: `ProtectedRoute` wrapper component

**Mechanism**:
1. On mount, check for active session via `getCurrentUser()`
2. If no session:
   - Show loading spinner briefly
   - Redirect to `/signin` with return URL
3. If session exists:
   - Render children components
   - Set user in state

**Return URL**:
- After signin, redirect to originally requested route
- Example: User tries `/dashboard` → Redirected to `/signin?returnUrl=/dashboard` → After signin → Redirected to `/dashboard`

### Implementation

```tsx
"use client";

export default function ProtectedRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/signin");
      } else {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
```

---

## Layouts

### Root Layout

**File**: `D:\Todo_giaic_five_phases\phase-2\frontend\app\layout.tsx`

**Type**: Server Component

**Purpose**: Root layout for all pages

**Features**:
- HTML document structure
- `<head>` metadata (title, description, icons)
- Font loading (Inter from Google Fonts)
- Theme provider (dark mode)
- Toast notification container
- PWA manifest link

**Code Structure**:
```tsx
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Todo App - Manage Your Tasks",
  description: "Stay organized and productive with our task management tool",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="light">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## Data Fetching

### Client-Side Data Fetching

All pages use **client-side data fetching** via the centralized API client.

**API Client**: `D:\Todo_giaic_five_phases\phase-2\frontend\lib\api.ts`

**Pattern**:
```tsx
"use client";

export default function Page() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await api.getTasks(userId, queryParams);
        if (response.success) {
          setData(response.data);
        } else {
          throw new Error(response.message);
        }
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  return <div>{/* Render data */}</div>;
}
```

### Why Client-Side?

1. **Authentication**: JWT tokens stored in HTTP-only cookies
2. **Interactivity**: Dashboard requires real-time updates and user interactions
3. **Dynamic Data**: Tasks change frequently, need fresh data
4. **Better Auth Integration**: Better Auth works best with client-side rendering

---

## SEO and Metadata

### Page Metadata

Each page can export metadata:

```tsx
export const metadata = {
  title: "Dashboard - Todo App",
  description: "Manage your tasks efficiently",
};
```

### Dynamic Metadata

For dynamic pages (not used in Phase II):

```tsx
export async function generateMetadata({ params }) {
  return {
    title: `Task ${params.id} - Todo App`,
  };
}
```

---

## Error Handling

### Page-Level Error Handling

**File**: `app/error.tsx` (not implemented in Phase II)

**Purpose**: Catch and display page-level errors

**Future Enhancement**:
```tsx
"use client";

export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Not Found Page

**File**: `app/not-found.tsx` (not implemented in Phase II)

**Purpose**: Display 404 page for unknown routes

**Future Enhancement**:
```tsx
export default function NotFound() {
  return (
    <div>
      <h2>404 - Page Not Found</h2>
      <Link href="/">Go back home</Link>
    </div>
  );
}
```

---

## Related Specifications

- **@specs/ui/components.md** - Components used in pages
- **@specs/features/authentication.md** - Authentication flow for protected routes
- **@specs/api/rest-endpoints.md** - API endpoints called from pages
- **@specs/architecture.md** - Page architecture and routing patterns

---

## Conclusion

The application includes 4 pages: Landing, Sign In, Sign Up, and Dashboard. Pages use Next.js 16 App Router with client-side rendering for authentication and interactivity. The Dashboard is protected via `ProtectedRoute` wrapper and provides comprehensive task management features.

**Page Summary**:
| Page | Route | Access | Purpose |
|------|-------|--------|---------|
| Landing | `/` | Public | Marketing and onboarding |
| Sign In | `/signin` | Public | User authentication |
| Sign Up | `/signup` | Public | User registration |
| Dashboard | `/dashboard` | Protected | Task management |
