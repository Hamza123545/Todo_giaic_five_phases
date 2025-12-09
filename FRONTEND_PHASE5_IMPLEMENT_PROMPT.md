# Frontend Phase 5: Task Organization - Implementation Prompt

Use with `/sp.implement` or Claude.

---

## Agent & References:
**Agent:** `frontend-feature-builder`  
**Read:** `specs/002-frontend-todo-app/spec.md` (User Story 3), `plan.md` (Phase 5), `tasks.md` (Phase 5), `contracts/api-contracts.md`, `.specify/memory/constitution.md`  
**Skills:** `.claude/skills/frontend-component/`, `.claude/skills/frontend-api-client/`, `.claude/skills/frontend-types/`

## Implementation Tasks:

1. **FilterControls Enhancement** (`/frontend/components/FilterControls.tsx`): Add status filter (all/pending/completed), priority filter (low/medium/high), due date filter (date picker), tags filter (multi-select), update UI with all filter options, maintain filter state

2. **SortControls Enhancement** (`/frontend/components/SortControls.tsx`): Add sort options (created, title, updated, priority, due_date), add sort direction (asc/desc), update UI with sort dropdown and direction toggle, maintain sort state

3. **SearchBar Enhancement** (`/frontend/components/SearchBar.tsx`): Add real-time search with debouncing (300ms), search in title and description, highlight search results, clear search button, maintain search state

4. **Query Parameter Integration** (`/frontend/lib/api.ts`): Update `getTasks()` to send all query parameters (status, sort, search, priority, due_date, tags, page, limit), ensure proper URL encoding, handle default values

5. **TaskList Updates** (`/frontend/components/TaskList.tsx`): Handle filtered/sorted/searched results, update to use query parameters, maintain URL state with query params, update when filters change, show loading state during filtering

6. **URL State Management** (`/frontend/app/dashboard/page.tsx` or hook): Add query parameter handling to maintain filter/sort/search state in URL, use Next.js useSearchParams, sync URL with filter state, restore state from URL on page load

7. **View Modes** (`/frontend/components/TaskList.tsx`): Implement multiple view modes (list, grid, kanban), add view mode toggle, persist view mode preference, update layout for each mode

8. **PaginationControls** (`/frontend/components/PaginationControls.tsx`): Create pagination component, show page numbers, previous/next buttons, current page indicator, total pages, integrate with API pagination

## Dependencies:
```bash
# Already installed, but verify:
npm install @dnd-kit/core @dnd-kit/sortable  # For drag-and-drop (if not already)
```

## Expected Files:
- Updated `/frontend/components/FilterControls.tsx` - Enhanced with all filters
- Updated `/frontend/components/SortControls.tsx` - Enhanced with all sort options
- Updated `/frontend/components/SearchBar.tsx` - Real-time search with debouncing
- Updated `/frontend/lib/api.ts` - Query parameter support
- Updated `/frontend/components/TaskList.tsx` - Filtered/sorted results, view modes
- `/frontend/components/PaginationControls.tsx` - New pagination component
- Updated `/frontend/app/dashboard/page.tsx` - URL state management
- `/frontend/hooks/useQueryParams.ts` - Custom hook for query params (optional)

## Requirements:
- All User Story 3 requirements covered
- Filtering by status, priority, due_date, tags
- Sorting by created, title, updated, priority, due_date
- Search by title/description keywords
- Pagination with page and limit
- Multiple view modes (list, grid, kanban)
- URL state management
- Real-time search with debouncing

## Testing:
```bash
# Run frontend dev server
cd frontend && npm run dev

# Test filtering
# Open dashboard, apply filters, verify URL updates and tasks filter

# Test sorting
# Change sort option, verify tasks reorder

# Test search
# Type in search bar, verify debouncing works, results update

# Test pagination
# Navigate pages, verify API calls with correct page/limit
```

## Test Scenarios:
- Apply status filter (pending/completed) → URL updates, tasks filter
- Apply priority filter → URL updates, tasks filter
- Apply due date filter → URL updates, tasks filter
- Apply tags filter → URL updates, tasks filter
- Change sort option → URL updates, tasks reorder
- Change sort direction → URL updates, tasks reorder
- Type in search → Debounced search, results update
- Change view mode → Layout changes, preference saved
- Navigate pagination → API calls with correct page/limit
- Refresh page → Filters/sort/search restored from URL

Implement Phase 5: All User Story 3 requirements, filtering, sorting, search, pagination, view modes, URL state management.

