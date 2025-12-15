# Tasks: Frontend Glass Morphism Redesign

**Input**: Design documents from `/specs/005-frontend-redesign/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/component-contracts.ts

**Tests**: Tests are NOT explicitly requested in the spec. Tasks focus on implementation and visual validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**User Input Context**: "create proper tasks for the implementation make sure all functionality should be same nothing should broken"

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/` for Next.js application
- Paths follow existing Next.js 16 App Router structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and configuration

- [ ] T001 Install new dependencies (lucide-react@^0.547.0, next-themes@^0.4.0, recharts@^2.15.0) in frontend/package.json
- [ ] T002 [P] Update frontend/tailwind.config.js with glass morphism utilities (colors, backdrop-blur, animations, keyframes)
- [ ] T002a [P] Document color palette in tailwind.config.js (indigo-500/600/700 for primary, green-500 for success, yellow-500 for warning, red-500 for error)
- [ ] T002b [P] Extend Tailwind config with custom color values if needed for glass morphism variants
- [ ] T002c [P] Verify color contrast ratios meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- [ ] T003 [P] Update frontend/app/globals.css with base styles, motion-safe animations, and custom scrollbar
- [ ] T004 [P] Create frontend/lib/utils.ts with cn() utility function for className merging (if not exists)
- [ ] T004a [P] Create frontend/lib/navigation.ts with NAV_ITEMS array containing: Dashboard (LayoutDashboard, /dashboard), Tasks (List, /tasks), AI Chatbot (MessageCircle, /chat), Calendar (Calendar, /calendar), Settings (Settings, /settings)
- [ ] T004b [P] Create frontend/lib/brand.ts with BRAND_CONFIG (name: "Todo Console", shortName: "Console", logo: HardHat icon, logoSize: 28)
- [ ] T004c [P] Create frontend/lib/task-status.ts with TaskStatus type ('todo' | 'in-progress' | 'done'), TASK_STATUS_MAP, KANBAN_COLUMNS array, and getTaskColumn() mapping function

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Update frontend/app/layout.tsx to wrap children with ThemeProvider from next-themes (attribute="class", defaultTheme="system", enableSystem)
- [ ] T006 [P] Create frontend/components/atoms/BackgroundBlobs.tsx with 3 animated gradient blobs (indigo, pink, blue)
- [ ] T006a [P] Verify blob positions: indigo blob at top-[-10rem] left-[-10rem] (w-80 h-80), pink blob at bottom-[-10rem] right-[-10rem] (w-96 h-96)
- [ ] T006b [P] Verify blob colors: indigo-500 (dark: indigo-700) and pink-500 (dark: pink-700) with opacity-20
- [ ] T006c [P] Verify animation: 7s infinite with animation-delay-2000 for second blob, mix-blend-multiply filter blur-3xl
- [ ] T007 [P] Create frontend/hooks/useLayoutState.ts hook for managing sidebar collapse and mobile menu state
- [ ] T008 [P] Create frontend/hooks/useMediaQuery.ts hook for responsive breakpoint detection (if needed)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Visual Experience Enhancement (Priority: P1) 🎯 MVP

**Goal**: Establish glass morphism visual design system with backdrop blur, semi-transparent cards, and smooth transitions

**Independent Test**: Navigate through any page and visually confirm glass morphism effects (backdrop blur, semi-transparent cards, gradient backgrounds, smooth transitions, hover effects)

**Why Critical**: This is the CORE value of the redesign - without glass morphism, the feature has no purpose

### Implementation for User Story 1

- [ ] T009 [P] [US1] Create frontend/components/atoms/GlassCard.tsx with variants (default, elevated, flat) and hover prop
- [ ] T010 [P] [US1] Create frontend/components/atoms/Button.tsx with glass morphism styling and variants (primary, secondary, ghost)
- [ ] T011 [P] [US1] Create frontend/components/molecules/ThemeToggle.tsx using useTheme from next-themes with Moon/Sun icons
- [ ] T012 [US1] Update frontend/app/layout.tsx to include BackgroundBlobs component before children
- [ ] T013 [US1] Test glass morphism effects on any existing page by wrapping content in GlassCard component
- [ ] T014 [US1] Verify dark mode toggle works without flash and transitions smoothly (< 500ms)
- [ ] T015 [US1] Verify hover effects on GlassCard and Button respond within 50ms
- [ ] T016 [US1] Verify prefers-reduced-motion media query disables animations correctly
- [ ] T017 [US1] Verify background gradient blobs animate smoothly at 60fps

**Checkpoint**: Glass morphism design system is established and working on at least one page

---

## Phase 4: User Story 2 - Desktop Navigation Experience (Priority: P2)

**Goal**: Implement fixed desktop sidebar navigation with collapse functionality for efficient desktop navigation

**Independent Test**: Access application on desktop browser (width ≥1024px), verify sidebar presence, navigation functionality, collapse/expand behavior, active state highlighting, and tooltip on hover when collapsed

**Why Important**: Desktop users benefit from efficient navigation - sidebar provides quick access to all sections

### Implementation for User Story 2

- [ ] T018 [P] [US2] Create frontend/components/organisms/Sidebar.tsx with navigation items, collapse toggle, and active state highlighting
- [ ] T018a [US2] Import NAV_ITEMS from frontend/lib/navigation.ts in Sidebar component
- [ ] T018b [US2] Import BRAND_CONFIG from frontend/lib/brand.ts in Sidebar component for logo and brand name
- [ ] T018c [US2] Use NAV_ITEMS array as items prop in Sidebar component
- [ ] T019 [US2] Update frontend/app/layout.tsx to render Sidebar component (hidden on mobile: lg:block, fixed positioning)
- [ ] T020 [US2] Implement sidebar collapse functionality in Sidebar component using useLayoutState hook (width transitions from w-64 to w-20)
- [ ] T021 [US2] Add active route highlighting using usePathname() from next/navigation in Sidebar component
- [ ] T022 [US2] Add tooltips for navigation items when sidebar is collapsed (show label on hover)
- [ ] T023 [US2] Style Sidebar with glass morphism effects using GlassCard component
- [ ] T024 [US2] Verify sidebar is visible and fixed on desktop viewports (≥1024px)
- [ ] T025 [US2] Verify sidebar collapse animation completes within 300ms
- [ ] T026 [US2] Verify active navigation item is highlighted with visual feedback
- [ ] T027 [US2] Verify tooltips appear on hover when sidebar is collapsed
- [ ] T028 [US2] Verify keyboard navigation works (Tab, Enter, Arrow keys)

**Checkpoint**: Desktop sidebar navigation is fully functional with collapse, active highlighting, and accessibility

---

## Phase 5: User Story 3 - Mobile Navigation Experience (Priority: P2)

**Goal**: Implement responsive top bar for mobile/tablet users with menu toggle and responsive behavior

**Independent Test**: Access application on mobile device or browser (width <1024px), verify top bar presence, menu toggle functionality, responsive behavior on scroll and orientation changes

**Why Important**: Mobile users need tailored navigation - top bar provides accessible navigation without taking screen space

### Implementation for User Story 3

- [ ] T029 [P] [US3] Create frontend/components/organisms/TopBar.tsx with menu toggle, logo, and theme toggle
- [ ] T029a [US3] Import NAV_ITEMS from frontend/lib/navigation.ts in TopBar component for mobile menu
- [ ] T029b [US3] Import BRAND_CONFIG from frontend/lib/brand.ts in TopBar component for logo and brand name
- [ ] T030 [US3] Update frontend/app/layout.tsx to render TopBar component (visible on mobile: block lg:hidden, fixed positioning)
- [ ] T031 [US3] Implement mobile menu toggle functionality in TopBar using useLayoutState hook
- [ ] T032 [US3] Create mobile menu overlay/drawer with navigation items (slides in when menu toggle is clicked)
- [ ] T033 [US3] Style TopBar with glass morphism effects using GlassCard component
- [ ] T034 [US3] Add main content padding-top to prevent TopBar from overlapping content (pt-20 lg:pt-8)
- [ ] T035 [US3] Verify top bar is visible on mobile/tablet viewports (<1024px)
- [ ] T036 [US3] Verify menu toggle opens and closes mobile navigation menu
- [ ] T037 [US3] Verify top bar remains accessible during scroll without interfering with content
- [ ] T038 [US3] Verify layout adapts responsively on device orientation changes
- [ ] T039 [US3] Verify mobile menu closes when user navigates to a new page

**Checkpoint**: Mobile top bar navigation is fully functional with menu toggle and responsive behavior

---

## Phase 6: User Story 4 - Dark Mode Preference (Priority: P3)

**Goal**: Ensure dark mode toggle is accessible on all pages with smooth transitions and theme persistence

**Independent Test**: Toggle dark mode switch and verify all components adapt correctly, system preference is respected on first load, theme persists across page reloads

**Why Quality-of-Life**: Enhances user comfort in different lighting conditions - already partially implemented in US1

### Implementation for User Story 4

- [ ] T040 [US4] Add ThemeToggle component to Sidebar component (desktop) in appropriate location (e.g., bottom or top)
- [ ] T041 [US4] Add ThemeToggle component to TopBar component (mobile) next to logo or in menu
- [ ] T042 [US4] Verify dark mode toggle transitions all components smoothly without jarring flashes
- [ ] T043 [US4] Verify system theme preference is respected on initial load (defaultTheme="system")
- [ ] T044 [US4] Verify theme preference persists across browser sessions (localStorage)
- [ ] T045 [US4] Test dark mode on all pages (Landing, Dashboard, Tasks, Chat, Settings, Calendar) to ensure consistent theming

**Checkpoint**: Dark mode is accessible from all navigation contexts and works consistently across all pages

---

## Phase 7: User Story 5 - Dashboard Overview (Priority: P3)

**Goal**: Redesign dashboard page with glass morphism stat cards, charts, activity log, and task list

**Independent Test**: Navigate to dashboard page, verify presence of 3 stat cards with icons and trends, charts with glass containers, chronological activity log, and prioritized task list

**Why Valuable**: Provides analytical insights and task overview - enhances user engagement with metrics

### Implementation for User Story 5

- [ ] T046 [P] [US5] Create frontend/components/molecules/StatCard.tsx with icon, value, trend, and optional mini chart
- [ ] T046a [US5] Create frontend/lib/dashboard-stats.ts with DashboardStats interface (activeTasks, completedTasks, avgPriorityScore with value and change properties)
- [ ] T046b [US5] Create API endpoint integration or mock data for dashboard stats (Active Tasks: 24780, Completed: 17489, Priority Score: 9962 with percentage changes)
- [ ] T046c [US5] Integrate dashboard stats data into StatCard components on Dashboard page
- [ ] T047 [P] [US5] Create frontend/components/molecules/ChartCard.tsx as container for Recharts components with glass morphism
- [ ] T048 [P] [US5] Create frontend/components/molecules/HeaderGreeting.tsx with user name, title, subtitle, and optional actions
- [ ] T049 [P] [US5] Create frontend/components/organisms/ActivityLog.tsx with chronological list of recent actions
- [ ] T050 [US5] Update frontend/app/dashboard/page.tsx to use new glass morphism components
- [ ] T051 [US5] Add HeaderGreeting component at top of dashboard page with user greeting
- [ ] T052 [US5] Add 3 StatCard components in responsive grid (Active Tasks, Completed Tasks, Priority Score)
- [ ] T053 [US5] Add ChartCard components for bar chart and line chart using Recharts
- [ ] T053a [US5] Create frontend/lib/chart-data.ts with ChartDataPoint interface (name, value, secondary?) and ChartData interface (labels, datasets with label, data, color)
- [ ] T053b [US5] Create API endpoint integration or mock data for charts (weekly data format: { name: 'W1', uv: 4000, pv: 2400 })
- [ ] T053c [US5] Integrate chart data into ChartCard components on Dashboard page (bar chart and line chart)
- [ ] T054 [US5] Integrate Recharts LineChart and BarChart components with glass morphism tooltips
- [ ] T055 [US5] Add ActivityLog component showing recent task actions (created, completed, updated, deleted)
- [ ] T056 [US5] Add prioritized task list card in sidebar/split layout (1/3 width on desktop)
- [ ] T057 [US5] Implement responsive grid layout: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop)
- [ ] T058 [US5] Add loading states for stat cards and charts (skeleton or spinner)
- [ ] T059 [US5] Verify dashboard displays all 3 stat cards with icons and values
- [ ] T060 [US5] Verify charts render correctly with glass morphism containers and responsive sizing
- [ ] T061 [US5] Verify activity log shows chronological recent actions
- [ ] T062 [US5] Verify task list shows prioritized tasks with visual priority indicators
- [ ] T063 [US5] Verify dashboard page loads within 2 seconds
- [ ] T064 [US5] Verify grid layout adapts responsively across breakpoints without content overflow

**Checkpoint**: Dashboard page is fully redesigned with glass morphism and provides comprehensive task overview

---

## Phase 8: User Story 6 - Kanban Task Management (Priority: P3)

**Goal**: Redesign Tasks page with three-column Kanban board layout (To Do, In Progress, Done) with glass morphism task cards

**Independent Test**: Navigate to Tasks page, verify three-column Kanban layout with task cards, task count badges, and "Add Task" buttons per column

**Why Enhances Visualization**: Provides workflow stage visualization - improves task management UX

### Implementation for User Story 6

- [ ] T065 [P] [US6] Create frontend/components/molecules/TaskCard.tsx with title, description, priority indicator, tags, and due date
- [ ] T066 [P] [US6] Create frontend/components/organisms/KanbanColumn.tsx with title, status, task count, and "Add Task" button
- [ ] T067 [P] [US6] Create frontend/components/organisms/TaskFilters.tsx with status, priority, tags, and search filters
- [ ] T068 [US6] Update frontend/app/tasks/page.tsx to use Kanban layout with three columns
- [ ] T069 [US6] Add HeaderGreeting component at top of Tasks page
- [ ] T070 [US6] Add TaskFilters component below header for filtering tasks
- [ ] T071 [US6] Add three KanbanColumn components (To Do, In Progress, Done) in horizontal layout
- [ ] T072 [US6] Map existing task data to Kanban columns based on status (use status field or completed boolean)
- [ ] T072a [US6] Import TaskStatus type and getTaskColumn() function from frontend/lib/task-status.ts
- [ ] T072b [US6] Use getTaskColumn() function to map tasks to Kanban columns (todo → "To Do", in-progress → "In Progress", done → "Done")
- [ ] T072c [US6] Update Task interface to include status field if not exists, or use completed boolean to determine status
- [ ] T073 [US6] Render TaskCard components within each KanbanColumn with glass morphism styling
- [ ] T074 [US6] Add priority indicators to TaskCard (colored dots: green=low, yellow=medium, red=high)
- [ ] T075 [US6] Add tag badges to TaskCard with glassmorphism styling
- [ ] T076 [US6] Add task count badges to KanbanColumn headers
- [ ] T077 [US6] Add "Add Task" button to each KanbanColumn header
- [ ] T078 [US6] Implement responsive layout: stacked columns on mobile, horizontal on desktop
- [ ] T079 [US6] Verify Kanban board displays three columns (To Do, In Progress, Done)
- [ ] T080 [US6] Verify task cards display with glass morphism styling and all task information
- [ ] T081 [US6] Verify priority indicators are visible and color-coded correctly
- [ ] T082 [US6] Verify task count badges display correct counts per column
- [ ] T083 [US6] Verify "Add Task" buttons are visible and functional
- [ ] T084 [US6] Verify existing task CRUD functionality remains unchanged (add, update, delete, complete)

**Checkpoint**: Tasks page is fully redesigned with Kanban layout and all existing functionality preserved

---

## Phase 9: Other Pages Redesign (All Remaining Pages)

**Goal**: Apply glass morphism to all remaining pages (Chat, Settings, Calendar, Landing, Sign In/Up) while preserving existing functionality

**Independent Test**: Navigate to each page and verify glass morphism styling is applied consistently, forms and interactive elements work correctly, existing functionality is preserved

**Why Complete**: Ensures consistent visual experience across entire application

### Chat Page

- [ ] T085 [US-Other] Update frontend/app/chat/page.tsx with glass morphism container for AI chatbot
- [ ] T086 [US-Other] Add HeaderGreeting component to Chat page
- [ ] T087 [US-Other] Wrap chat widget in GlassCard component
- [ ] T088 [US-Other] Verify chat functionality remains unchanged (message sending, receiving, streaming)

### Settings Page

- [ ] T089 [US-Other] Update frontend/app/settings/page.tsx with tabbed interface (Profile, Notifications, Security)
- [ ] T090 [US-Other] Add HeaderGreeting component to Settings page
- [ ] T091 [US-Other] Create tab navigation with glass morphism styling
- [ ] T092 [US-Other] Style form inputs with glass morphism effects (input, select, textarea)
- [ ] T093 [US-Other] Verify settings functionality remains unchanged (save preferences, update profile, security settings)

### Calendar Page (if exists, otherwise create placeholder)

- [ ] T094 [US-Other] Update or create frontend/app/calendar/page.tsx with monthly grid view
- [ ] T095 [US-Other] Add HeaderGreeting component to Calendar page
- [ ] T096 [US-Other] Create 7-column grid for days of the week with glass morphism cells
- [ ] T096a [US-Other] Create frontend/lib/calendar.ts with CalendarEvent interface (id, date, title, type?: 'meeting' | 'deadline' | 'milestone', color?) and CalendarDay interface (date, isToday, events)
- [ ] T096b [US-Other] Create API endpoint integration or mock data for calendar events (array of dates with events, e.g., [5, 12, 19, 26])
- [ ] T096c [US-Other] Integrate calendar event data into calendar grid with event indicators and labels
- [ ] T097 [US-Other] Add event indicators and today highlighting
- [ ] T098 [US-Other] Implement responsive grid (stacked on mobile, grid on desktop)

### Landing Page

- [ ] T099 [US-Other] Update frontend/app/page.tsx with glass morphism hero section
- [ ] T100 [US-Other] Apply glass morphism to feature cards and call-to-action buttons
- [ ] T101 [US-Other] Verify landing page navigation to sign in/up works correctly

### Authentication Pages (Sign In / Sign Up)

- [ ] T102 [US-Other] Update authentication pages with glass morphism form containers
- [ ] T103 [US-Other] Apply glass morphism to input fields, labels, and buttons
- [ ] T104 [US-Other] Verify authentication flows remain unchanged (sign in, sign up, password reset)
- [ ] T105 [US-Other] Verify Better Auth integration continues to function correctly

**Checkpoint**: All pages have consistent glass morphism design and existing functionality is preserved

---

## Phase 10: Testing, Refinement & Quality Assurance

**Purpose**: Comprehensive testing, accessibility validation, performance optimization, and bug fixes

**Critical**: Ensure "all functionality should be same nothing should broken" per user requirement

- [ ] T111 [P] Run Lighthouse performance audit on all pages (target score > 90)
- [ ] T112 [P] Test color contrast with Chrome DevTools on all pages (target: 4.5:1 for normal text, 3:1 for large text)
- [ ] T113 [P] Test keyboard navigation on all interactive elements (Tab, Enter, Arrow keys, Escape)
- [ ] T114 Test screen reader compatibility (NVDA on Windows or VoiceOver on Mac) on key user flows
- [ ] T115 Test responsive design on real mobile devices (iOS Safari, Android Chrome)
- [ ] T116 Test responsive design on tablet devices (iPad, Android tablet)
- [ ] T117 Test responsive design on desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] T118 Test dark mode toggle on all pages and verify smooth transitions
- [ ] T119 Test prefers-reduced-motion support (enable in OS settings and verify animations are disabled)
- [ ] T120 Test sidebar collapse/expand functionality on desktop
- [ ] T121 Test mobile menu toggle functionality on mobile/tablet
- [ ] T122 Test all existing features to ensure nothing is broken:
  - [ ] T122a Task creation (add new task)
  - [ ] T122b Task update (edit existing task)
  - [ ] T122c Task completion (mark as complete)
  - [ ] T122d Task deletion (delete task)
  - [ ] T122e Task filtering (by status, priority, tags)
  - [ ] T122f User authentication (sign in, sign up, sign out)
  - [ ] T122g User profile updates
  - [ ] T122h AI chatbot interactions
  - [ ] T122i Settings persistence
- [ ] T123 Verify bundle size increase is under 100KB gzipped (use webpack-bundle-analyzer or similar)
- [ ] T124 Verify First Contentful Paint (FCP) is under 1.5 seconds on 4G network
- [ ] T125 Verify Time to Interactive (TTI) is under 3 seconds on 4G network
- [ ] T126 Verify Cumulative Layout Shift (CLS) is under 0.1
- [ ] T127 Verify animations run at 60fps on mid-range devices (use Chrome DevTools Performance)
- [ ] T128 Test graceful degradation on browsers without backdrop-filter support (verify solid backgrounds with opacity)
- [ ] T129 Fix any accessibility issues found during testing
- [ ] T130 Fix any performance issues found during testing
- [ ] T131 Fix any responsive design issues found during testing
- [ ] T132 Fix any functionality regressions found during testing
- [ ] T133 Document any known issues or limitations in README or docs
- [ ] T134 Validate quickstart.md instructions are accurate and complete

**Checkpoint**: All tests pass, accessibility validated, performance optimized, existing functionality verified

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001-T004) - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion (T005-T008)
- **User Story 2 (Phase 4)**: Depends on Foundational + US1 completion (needs GlassCard, ThemeToggle)
- **User Story 3 (Phase 5)**: Depends on Foundational + US1 completion (needs GlassCard, ThemeToggle)
- **User Story 4 (Phase 6)**: Depends on US2 and US3 completion (adds ThemeToggle to navigation)
- **User Story 5 (Phase 7)**: Depends on Foundational + US1 completion (needs StatCard, ChartCard, HeaderGreeting)
- **User Story 6 (Phase 8)**: Depends on Foundational + US1 completion (needs TaskCard, KanbanColumn)
- **Other Pages (Phase 9)**: Depends on US1 completion (needs all base components)
- **Testing (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
  - **MVP Candidate**: YES ✅ - Core value of the redesign
- **User Story 2 (P2)**: Can start after Foundational + US1 (needs GlassCard, ThemeToggle)
  - **MVP Candidate**: NO - Desktop navigation enhancement, not core value
- **User Story 3 (P2)**: Can start after Foundational + US1 (needs GlassCard, ThemeToggle)
  - **MVP Candidate**: NO - Mobile navigation enhancement, not core value
- **User Story 4 (P3)**: Depends on US2 and US3 (integrates ThemeToggle into navigation)
  - **MVP Candidate**: NO - Quality of life feature
- **User Story 5 (P3)**: Can start after Foundational + US1 (needs all molecule components)
  - **MVP Candidate**: NO - Dashboard enhancement, not core value
- **User Story 6 (P3)**: Can start after Foundational + US1 (needs TaskCard, KanbanColumn)
  - **MVP Candidate**: NO - Task visualization enhancement, not core value

### Within Each User Story

- Tests (if included) would be written and verified to FAIL before implementation (not applicable - no tests requested)
- Atom components before molecule components
- Molecule components before organism components
- Organism components before page updates
- Page updates before validation tasks
- Validation tasks before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**: All tasks can run in parallel
- T002, T003, T004 can run in parallel (different files)
- T001 must complete before T005 (dependencies installed)

**Phase 2 (Foundational)**: T006, T007, T008 can run in parallel
- T005 must complete first (layout.tsx blocks other components)

**Phase 3 (US1)**: T009, T010, T011 can run in parallel (different component files)

**Phase 4 (US2)**: T018 can start immediately after Phase 2
- Other tasks are sequential (depend on Sidebar component)

**Phase 5 (US3)**: T029 can start immediately after Phase 2
- Other tasks are sequential (depend on TopBar component)

**Phase 7 (US5)**: T046, T047, T048, T049 can run in parallel (different component files)

**Phase 8 (US6)**: T065, T066, T067 can run in parallel (different component files)

**Phase 9 (Other Pages)**: T085-T105 can be parallelized by page
- Chat page tasks (T085-T088)
- Settings page tasks (T089-T093)
- Calendar page tasks (T094-T098)
- Landing page tasks (T099-T101)
- Auth page tasks (T102-T105)

**Phase 10 (Testing)**: T111, T112, T113 can run in parallel (different testing tools)

---

## Parallel Example: User Story 1

```bash
# Launch all base components for User Story 1 together:
Task: "Create frontend/components/atoms/GlassCard.tsx"
Task: "Create frontend/components/atoms/Button.tsx"
Task: "Create frontend/components/molecules/ThemeToggle.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T008) - CRITICAL
3. Complete Phase 3: User Story 1 (T009-T017)
4. **STOP and VALIDATE**: Test glass morphism effects independently
5. Deploy/demo glass morphism MVP if ready

**Estimated Effort**: 1-2 days for MVP (Setup + Foundational + US1)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! Core glass morphism)
3. Add User Story 2 → Test independently → Deploy/Demo (Desktop navigation)
4. Add User Story 3 → Test independently → Deploy/Demo (Mobile navigation)
5. Add User Story 4 → Test independently → Deploy/Demo (Dark mode integration)
6. Add User Story 5 → Test independently → Deploy/Demo (Dashboard redesign)
7. Add User Story 6 → Test independently → Deploy/Demo (Kanban redesign)
8. Add Other Pages → Test independently → Deploy/Demo (Complete redesign)
9. Complete Testing Phase → Final validation → Production deploy

**Estimated Total Effort**: 3-5 days (P1: 1 day, P2: 1 day, P3: 2-3 days)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (1 day)
2. Once Foundational is done:
   - Developer A: User Story 1 (glass morphism core)
   - Developer B: User Story 2 (desktop sidebar)
   - Developer C: User Story 3 (mobile top bar)
3. After US1, US2, US3 complete:
   - Developer A: User Story 5 (dashboard)
   - Developer B: User Story 6 (Kanban)
   - Developer C: User Story 4 + Other pages
4. All developers: Testing phase together

---

## Task Summary

### Total Tasks: 129

**Note**: Finance page removed (not in Phase III requirements). Original 134 tasks reduced by 5 Finance tasks.

**By Phase**:
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 4 tasks
- Phase 3 (US1 - Visual Experience): 9 tasks
- Phase 4 (US2 - Desktop Navigation): 11 tasks
- Phase 5 (US3 - Mobile Navigation): 11 tasks
- Phase 6 (US4 - Dark Mode): 6 tasks
- Phase 7 (US5 - Dashboard): 19 tasks
- Phase 8 (US6 - Kanban): 20 tasks
- Phase 9 (Other Pages): 21 tasks (Finance page removed: -5 tasks)
- Phase 10 (Testing & QA): 24 tasks

**By Priority**:
- P1 (Core glass morphism): 9 tasks (US1)
- P2 (Navigation): 22 tasks (US2 + US3)
- P3 (Features): 40 tasks (US4 + US5 + US6)
- Other Pages: 21 tasks (Finance removed: -5 tasks)
- Setup/Foundational: 8 tasks
- Testing: 24 tasks

**Parallelizable Tasks**: 23 tasks marked with [P]

---

## Critical Requirements (User Context)

**"make sure all functionality should be same nothing should broken"**

### Verification Tasks for Existing Functionality

All existing functionality MUST be preserved and tested:

✅ **Authentication** (T102-T105):
- Sign in, sign up, sign out flows
- Better Auth integration
- Password reset functionality

✅ **Task Management** (T122a-e, T084):
- Create new tasks
- Update existing tasks
- Mark tasks as complete
- Delete tasks
- Filter tasks by status, priority, tags
- Search tasks

✅ **User Profile** (T093, T122g):
- View profile
- Update profile information
- Settings persistence

✅ **AI Chatbot** (T088, T122h):
- Send messages
- Receive responses
- Streaming responses (if applicable)

✅ **API Integration** (All pages):
- All existing API endpoints remain unchanged
- Data fetching continues to work
- Error handling preserved

✅ **Responsive Behavior** (T115-T117):
- Layout adapts correctly across breakpoints
- No content overflow
- Touch interactions work on mobile

### Rollback Plan

If any existing functionality is broken during implementation:

1. Identify the breaking change by task number
2. Revert the specific task/commit
3. Re-implement with preservation of existing functionality
4. Add validation test to T122 checklist
5. Continue with remaining tasks

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group of tasks
- Stop at any checkpoint to validate story independently
- Verify existing functionality remains intact at EVERY checkpoint
- **CRITICAL**: Run T122 (functionality verification) after EVERY phase
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- If any task breaks existing functionality, STOP and fix immediately before proceeding
