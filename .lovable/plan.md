

# Plan: Board View for Initiatives and Tasks

## Overview
Add a Kanban-style Board view as an alternative to the existing list view on the Initiatives page. Users can toggle between "List" and "Board" views. The board organizes initiatives into columns by status, and each initiative card can be expanded to see its tasks, also organized by task status.

## How It Works

### View Toggle
A segmented control (List | Board) will be added to the Initiatives page header, next to the existing "Create Initiative" button. The current list view remains the default; clicking "Board" switches to the Kanban layout.

### Board Layout
- **4 columns**: Not Started, In Progress, Completed, Blocked
- Each column displays initiative cards belonging to that status
- Cards show: title, owner, date range, linked KR count, task count
- Clicking a card opens the existing InitiativeDetailDrawer
- Edit/delete actions remain accessible via card buttons

### Drag and Drop
- Users can drag initiative cards between columns to change their status
- Uses HTML5 drag-and-drop (no additional library needed)
- Only users with edit permissions (admin, manager, or owner) can drag
- Dropping a card triggers the existing `updateInitiative` mutation

### Task Sub-Board (Expandable)
- Each initiative card has a "Tasks" expand toggle
- When expanded, tasks appear as a mini horizontal Kanban (Todo, In Progress, Blocked, Done)
- Tasks can also be dragged between status columns

### Navigation
- Add a new route `/app/board` with a sidebar entry
- Or: keep it as a view toggle on the existing `/app/initiatives` page (preferred -- no new route needed)

I'll go with the **view toggle approach** on the existing Initiatives page to keep navigation simple.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/initiatives/BoardView.tsx` | Main board layout with 4 status columns |
| `src/components/initiatives/BoardColumn.tsx` | Single status column with drop zone |
| `src/components/initiatives/BoardInitiativeCard.tsx` | Draggable initiative card for the board |
| `src/components/initiatives/BoardTaskRow.tsx` | Mini task status columns within an expanded initiative |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Initiatives.tsx` | Add view toggle state (list/board), render BoardView when board is selected, pass filtered initiatives |

---

## Technical Details

### View Toggle Component
Uses the existing Tabs component from the UI library to switch between "List" and "Board" views. State is local (not persisted to URL or database).

### Drag-and-Drop Implementation
Uses native HTML5 drag-and-drop API:
- `draggable` attribute on cards
- `onDragStart` sets the initiative/task ID and type in `dataTransfer`
- `onDragOver` on columns to allow drops and show visual hover state
- `onDrop` reads the ID and calls `updateInitiative.mutate({ id, status: columnStatus })`

### Column Layout
```text
+----------------+----------------+----------------+----------------+
|  Not Started   |  In Progress   |   Completed    |    Blocked     |
+----------------+----------------+----------------+----------------+
| [Card]         | [Card]         | [Card]         | [Card]         |
| [Card]         |                |                |                |
|                |                |                |                |
+----------------+----------------+----------------+----------------+
```

### Board Initiative Card Content
- Title + status badge
- Owner name
- Date range (if set)
- KR link count
- Task count with completion ratio (e.g., "3/5 tasks done")
- Edit/Delete buttons (permission-gated)

### Filters
The existing `InitiativeFilters` component will work for both views. Filters apply to the board the same way they apply to the list -- initiatives not matching filters are hidden from the board columns.

### Responsive Behavior
On mobile, columns stack vertically or become horizontally scrollable to maintain usability.

