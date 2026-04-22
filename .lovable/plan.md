

## Fix Edit Button Affordance + Promote Native Titles to Tooltips

In `src/components/okrs/KeyResultItem.tsx`, replace the misleading "click → destructive toast" pattern on the Edit button with a visibly disabled button + explanatory tooltip, and upgrade the other three native `title` attributes on the row's icon buttons to proper Radix tooltips.

### File: `src/components/okrs/KeyResultItem.tsx`

- Add `Tooltip`, `TooltipContent`, `TooltipTrigger` to existing imports from `@/components/ui/tooltip`.
- Remove the `useToast` import and the `const { toast } = useToast();` line — no longer used in this file.
- Remove the `handleEditClick` function entirely.
- Remove every `title="..."` attribute from the four icon buttons in the action row.

For each of the four icon buttons in the hover-action group, replace the bare `<Button …>` with a `<Tooltip delayDuration={300}>` wrapping `<TooltipTrigger asChild>` + the button + `<TooltipContent>`:

1. **View metrics** (`BarChart3`) — unchanged behaviour, tooltip text `"View metrics"`.
2. **Add sub Key Result** (`Plus`, gated by `canManage`) — tooltip text `"Add sub Key Result"`.
3. **Edit** (`Pencil`) — split by `canEdit`:
   - `canEdit === true`: `onClick={() => setShowEditKR(true)}`, tooltip text `"Edit"`.
   - `canEdit === false`: button gets `disabled={true}`. Because disabled buttons don't fire pointer events, `TooltipTrigger asChild` wraps a `<span tabIndex={0}>` that wraps the disabled `<Button>`. Tooltip text: `"You can only edit Key Results that you own."`
4. **Delete** (`Trash2`, gated by `canManage`) — tooltip text `"Delete"`.

All four tooltips use `delayDuration={300}`. No `side` override needed (default is fine for a horizontal action row).

### Unchanged
Child KR recursion, dialog state, `KRDetailPanel`, permission constants (`canManage`, `canEdit`, `isOwner`), progress bar, badges, and the row's outer layout all stay exactly as they are. `TooltipProvider` is already mounted app-wide so no provider is added here.

### Out of scope
No other files. No changes to hooks, types, or styling tokens.

