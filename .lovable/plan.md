

## Plan: Subtasks and Nested Subtasks in Timeline View

### Current State
The timeline renders a flat list of tasks under each initiative. Tasks already have a `parent_task_id` column in the database, and `createTask` supports `parentTaskId`. However, the timeline shows all tasks at the same indentation level with no hierarchy.

### Changes

#### 1. `src/components/timeline/TimelineRow.tsx` -- Recursive task rendering with subtask creation

- Build a tree from `initiative.tasks` using `parent_task_id` (root tasks have `parent_task_id === null`)
- Replace the flat task `.map()` (lines 239-310) with a recursive `renderTaskRow` function that:
  - Renders the task row with indentation based on depth (`pl-10` for depth 0, `pl-14` for depth 1, `pl-18` for depth 2, etc.)
  - Shows a collapse/expand chevron if the task has children
  - Shows a "+" button on hover to create a subtask (calls `createTask` with `parentTaskId`)
  - Recursively renders child tasks when expanded
- Track expanded state per task ID (default expanded)
- Track inline-create state per task ID (which task is currently showing the subtask creation input)

#### 2. No other files need changes
- `useTasks` already supports `parentTaskId` in `createTask`
- The database `tasks` table already has `parent_task_id`
- No schema changes needed

### Key Implementation Detail

```text
Initiative Row
  ├── Task A (root, parent_task_id=null)     [+]
  │   ├── Subtask A1 (parent=A)              [+]
  │   │   └── Sub-subtask A1a (parent=A1)    [+]
  │   └── Subtask A2 (parent=A)
  └── Task B (root, parent_task_id=null)
```

Each level adds ~16px (`pl-4`) of indentation. The "+" button appears on hover for any task the user can manage. Chevrons appear when a task has children.

### Files to modify
- `src/components/timeline/TimelineRow.tsx` -- recursive task tree rendering with inline subtask creation

