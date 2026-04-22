

## Add Inline Help to Create Task Dialog

Make `src/components/tasks/CreateTaskDialog.tsx` self-explanatory by attaching `InfoTooltip` to every field label and tightening the Title placeholder. The current dialog has Title, Description, Assignee, Status, Start Date, and Due Date — no Priority, Initiative, Dependencies, or Watchers fields, so those tooltips are skipped (this dialog is launched from inside an initiative, so the initiative is implicit via `initiativeId` prop).

### File: `src/components/tasks/CreateTaskDialog.tsx`

**Imports**
- Add: `import { InfoTooltip } from "@/components/ui/InfoTooltip";`

**Labels — convert each to `className="flex items-center"` and append an `<InfoTooltip>`**

- **Title** (`<Label htmlFor="title">`): "A concrete, actionable work item. Start with a verb. Example: 'Draft referral email copy.'"
- **Description**: "Optional details, context, or acceptance criteria."
- **Assignee**: "One person responsible for completing this task. Different from the initiative owner."
- **Status**: "Todo (not started), In Progress (being worked on), Blocked (stuck), Done (completed)."
- **Start Date**: "When work on this task is expected to begin."
- **Due Date**: "When this task must be complete. Appears in Calendar and drives 'overdue' flags."

**Title placeholder**
- Change `placeholder="Task title"` → `placeholder="e.g., Draft referral email copy"`

### Fields not present in this dialog (skipped)
- **Priority** — no priority field exists on `CreateTaskDialog`.
- **Initiative / Parent** — implicit; the dialog is mounted with `initiativeId` from the parent and there is no selector.
- **Dependencies / Blocks / Blocked by** — not part of the create flow; dependencies are managed elsewhere (e.g., `useTaskDependencies` from the task detail drawer). The critical disambiguation tooltip would belong there, not here. Flagging this so it can be addressed in a follow-up against `TaskDetailDrawer.tsx` / `SubtaskList.tsx` if desired.
- **Watchers** — not part of the create flow (`useTaskWatchers` is wired through the detail drawer).

### Unchanged
`useState` shape, `handleSubmit`, `resetForm`, `AssigneeSelector`, dialog frame / footer, validation, and all other files.

### Out of scope
No edits to `useTasks`, `AssigneeSelector`, `TaskDetailDrawer`, or any other component. No styling-token changes.

