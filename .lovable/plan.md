

## Initiative Detail Page with Gantt Timeline

### Problem
Currently, initiative owners can only see the shared summary page after sharing it externally. There's no way to preview or use it as an internal initiative page. The shared page also lacks a proper Gantt/timeline view of tasks.

### Solution
Create a dedicated **Initiative Page** at `/app/initiatives/:id` that serves as the full detail view for an initiative. This page will be accessible to all authenticated org members and will include a read-only Gantt timeline of tasks. The external shared page (`/share/initiative/:token`) will also be upgraded to include the same Gantt view with limited interactivity (zoom/group controls only).

### What the Initiative Page Shows

1. **Header** -- Title, status badge, owner, date range, description
2. **Task Progress** -- Completion bar (done/total)
3. **Mini Gantt Timeline** -- Read-only timeline of tasks/subtasks using existing `TimelineChart` rendering logic but simplified (no drag, no dependency arrows, no color picker). Viewer controls: zoom level (day/week/month/quarter) and group-by toggle
4. **Linked Key Results** -- KR cards with metric progress bars
5. **Updates & Comments** -- Activity feed (read-only on shared page, interactive on internal page)
6. **File Attachments** -- (internal page only)

### Implementation

#### 1. New Page: `src/pages/InitiativeDetail.tsx`
- Protected route at `/app/initiatives/:id`
- Fetches initiative via `useInitiatives()`, tasks via `useTasks(initiativeId)`, KR links via `useInitiativeKRLinks(initiativeId)`
- Renders header, progress, embedded mini Gantt, KRs, activity feed, file attachments
- Includes Share button for owners/managers
- Full interactivity (edit initiative, manage tasks via drawers)

#### 2. New Component: `src/components/initiatives/InitiativeGantt.tsx`
- A self-contained mini Gantt component that takes tasks array and renders a simplified timeline
- Accepts `readOnly` prop (disables drag/resize/color picker)
- Includes its own zoom level and group-by controls (the only interactive elements for shared viewers)
- Reuses existing `TimelineChart` internals (bar rendering, date math, today line) but without dependency arrows or inline create
- Used by both `InitiativeDetail.tsx` (internal) and `SharedInitiative.tsx` (external)

#### 3. Update `src/pages/SharedInitiative.tsx`
- Replace the current flat task list with the new `InitiativeGantt` component in read-only mode
- Pass the tasks data from the edge function response into the Gantt
- Viewer can change zoom level and grouping -- no other controls

#### 4. Route Changes in `src/App.tsx`
- Add protected route: `/app/initiatives/:id` → `InitiativeDetail`

#### 5. Navigation Integration
- Update `InitiativeCard.tsx` to navigate to `/app/initiatives/:id` on click instead of opening the drawer
- Keep the drawer available as an option (e.g., from timeline clicks)

### Files Summary

| File | Change |
|------|--------|
| `src/pages/InitiativeDetail.tsx` | New: full initiative detail page |
| `src/components/initiatives/InitiativeGantt.tsx` | New: reusable mini Gantt for single initiative |
| `src/pages/SharedInitiative.tsx` | Replace task list with `InitiativeGantt` (read-only) |
| `src/App.tsx` | Add `/app/initiatives/:id` route |
| `src/components/initiatives/InitiativeCard.tsx` | Navigate to detail page on click |

### No Backend Changes
All data already exists. The internal page uses existing hooks; the shared page already receives tasks from the edge function.

