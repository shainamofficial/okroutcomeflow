

## Human-readable Automation Descriptions + Better Empty State

Make automation cards self-explanatory by rendering a full sentence (with the configured status / recipient values) instead of the current generic "trigger label → action label" pair. Also expand the empty state with a concrete example.

### File: `src/pages/Automations.tsx`

**Imports**
- Drop `ArrowRight` from the `lucide-react` import (no longer used).

**New helper (module scope, above `export default`)**

```ts
const titleCase = (s: string) =>
  s.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

function describeAutomation(auto: { trigger_type: string; trigger_config: any; action_type: string; action_config: any; }): string {
  const tc = auto.trigger_config || {};
  const ac = auto.action_config || {};

  let triggerClause: string;
  switch (auto.trigger_type) {
    case "task_status_change":
      triggerClause = `When a task becomes ${titleCase(tc.to_status ?? "")}`; break;
    case "initiative_status_change":
      triggerClause = `When an initiative becomes ${titleCase(tc.to_status ?? "")}`; break;
    case "all_tasks_done":
      triggerClause = "When all tasks in an initiative are done"; break;
    case "due_date_passed":
      triggerClause = tc.object_type === "initiative"
        ? "When an initiative's due date passes"
        : "When a task's due date passes";
      break;
    default:
      triggerClause = TRIGGERS.find(t => t.value === auto.trigger_type)?.label ?? auto.trigger_type;
  }

  let actionClause: string;
  switch (auto.action_type) {
    case "change_initiative_status":
      actionClause = `change its initiative to ${titleCase(ac.to_status ?? "")}`; break;
    case "change_task_status":
      actionClause = `set the task to ${titleCase(ac.to_status ?? "")}`; break;
    case "send_notification":
      actionClause = `notify the ${(ac.recipient ?? "").replace(/_/g, " ")}`; break;
    case "create_update":
      actionClause = "post an update"; break;
    default:
      actionClause = ACTIONS.find(a => a.value === auto.action_type)?.label ?? auto.action_type;
  }

  return `${triggerClause}, ${actionClause}.`;
}
```

**Card render change** (inside `automations.map`):
- Remove the `triggerLabel` / `actionLabel` consts and the `<div>` containing them + `<ArrowRight />`.
- Replace with: `<p className="text-xs text-muted-foreground mt-0.5">{describeAutomation(auto)}</p>`.
- Keep the name + Disabled badge row, the Switch, and the delete button untouched.

**Empty state**
- Replace the current single `<p>` with a two-line explanation:
  > "Automations run when-then rules in the background. For example: when a task becomes Done, automatically mark its initiative as Completed."
- Below the paragraph, render the existing **New Automation** dialog trigger button when `canManage` (re-using the same `Dialog` open state already in scope, e.g. an additional `<Button onClick={() => setOpen(true)}>` with the `Plus` icon and `mt-4` spacing). The header's dialog instance handles the actual dialog mount; the empty-state button just opens it.

### Out of scope
No changes to constants, hooks, or any other file. Loading skeleton and dialog body stay as-is.

