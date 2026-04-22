

## Configurable Triggers & Actions for Automations

Rewrite the create-automation dialog in `src/pages/Automations.tsx` so each rule captures the specific status / recipient / message it needs. Today both `trigger_config` and `action_config` are saved as `{}`, making rules ambiguous at execution time.

### File: `src/pages/Automations.tsx`

**Imports**
- Add `Textarea` from `@/components/ui/textarea`.
- Add `DialogDescription` to the existing `@/components/ui/dialog` import.
- Add `InfoTooltip` from `@/components/ui/InfoTooltip`.

**Extend the constants (keep existing shape, add schema metadata)**

Add a `config` field describing required keys + their option lists:

- `TRIGGERS`
  - `task_status_change` → `config: { to_status: { label: "When status changes to", options: ["todo","in_progress","blocked","done"], required: true } }`
  - `all_tasks_done` → `config: {}`
  - `initiative_status_change` → `config: { to_status: { label: "When status changes to", options: ["not_started","in_progress","completed","blocked"], required: true } }`
  - `due_date_passed` → `config: { object_type: { label: "Applies to", options: ["task","initiative"], required: true } }`

- `ACTIONS`
  - `change_initiative_status` → `config: { to_status: { label: "Change initiative status to", options: ["not_started","in_progress","completed","blocked"], required: true } }`
  - `change_task_status` → `config: { to_status: { label: "Change task status to", options: ["todo","in_progress","blocked","done"], required: true } }`
  - `send_notification` → `config: { recipient: { label: "Notify", options: ["initiative_owner","task_assignee","all_admins"], required: true }, message: { label: "Message", type: "textarea", required: false } }`
  - `create_update` → `config: { content: { label: "Update content", type: "textarea", required: true } }`

**State**
- `triggerConfig: Record<string, any>` (default `{}`)
- `actionConfig: Record<string, any>` (default `{}`)
- Wrap `setTrigger` / `setAction` so changing either resets the corresponding config to `{}`.
- Also reset both configs (and name) inside `onSuccess`, alongside the existing resets.

**Helpers**
- `isConfigComplete()` — looks up the selected trigger/action definitions and returns `false` if any field marked `required: true` is missing or empty in the corresponding config state. Returns `true` when nothing is selected yet (gate is the existing `!trigger || !action` check).
- A small inline `renderConfigFields(schema, value, onChange)` function renders each field — `Select` for option lists, `Textarea` when `type: "textarea"`. Only invoked when the schema has at least one key.

**Dialog body changes**
- Add `<DialogDescription>` under `DialogTitle`: *"Build a when-then rule. OKRoutcomeFlow will run it automatically whenever the trigger event happens."*
- Next to the **When (Trigger)** label add `<InfoTooltip>`: *"The event that starts this automation."*
- Next to the **Then (Action)** label add `<InfoTooltip>`: *"What OKRoutcomeFlow does when the trigger fires."*
- Below the trigger `Select`, when a trigger is chosen and its schema is non-empty, render a block:
  ```
  <div className="rounded-md border bg-muted/30 p-3 space-y-3">
    <div className="text-xs font-medium text-muted-foreground">Trigger details</div>
    {renderConfigFields(...)}
  </div>
  ```
- Identical block below the action select titled **"Action details"**.
- Disable the Create button when `!name || !trigger || !action || !isConfigComplete() || createAutomation.isPending`.
- Pass `trigger_config: triggerConfig` and `action_config: actionConfig` into `createAutomation.mutate(...)`.

### Out of scope
No changes to `useAutomations.ts`, the automations list rendering, or any other file. Status option labels stay as raw enum strings (matches existing badges elsewhere); no label-prettifying map is introduced.

