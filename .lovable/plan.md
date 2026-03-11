

## Fix Timeline Update Delay + Enhance Initiative Page Gantt

### Issue 1: Timeline Update Delay

**Root cause**: When a task is dragged on the timeline, `TimelineRow` calls `updateTask.mutate()` from `useTasks(initiativeId)`. That mutation invalidates `queryKey: ["tasks"]`, but the Timeline page fetches tasks via `useAllTasks()` which uses `queryKey: ["all_tasks", orgId]`. The `["all_tasks"]` cache is never invalidated, so the timeline doesn't reflect changes until a background refetch.

**Fix**: In `useTasks.ts`, update all three mutations (`createTask`, `updateTask`, `deleteTask`) to also invalidate `["all_tasks"]`. Additionally, add optimistic updates to the `updateTask` mutation so the bar snaps to its new position immediately instead of waiting for the server round-trip.

| File | Change |
|------|--------|
| `src/hooks/useTasks.ts` | Add `queryClient.invalidateQueries({ queryKey: ["all_tasks"] })` to all mutation `onSuccess` callbacks. Add optimistic update for `updateTask`. |

### Issue 2: Initiative Page Gantt Missing Subtask Nesting UI

**Root cause**: `InitiativeGantt` renders the task tree recursively (subtasks are nested), but each row only shows a plain text title — no expand/collapse chevrons, no status badges, no assignee info. This makes it look flat compared to the main timeline view.

**Fix**: Enhance `InitiativeGantt`'s `renderTaskRow` to match the timeline's `TimelineRow` style:
- Add expand/collapse chevrons for tasks with children
- Show `TaskStatusBadge` next to task title
- Show assignee name/team name
- Track expanded state per task (default expanded)
- Add indentation guides similar to timeline

| File | Change |
|------|--------|
| `src/components/initiatives/InitiativeGantt.tsx` | Add expand/collapse state, chevron icons, `TaskStatusBadge`, assignee display in the label column. Import necessary components. |

### Summary
Two targeted fixes — one cache invalidation bug in `useTasks.ts`, one UI enhancement in `InitiativeGantt.tsx`. No backend changes needed.

