

## Add Inline Help to Create Initiative Dialog

Make `src/components/initiatives/CreateInitiativeDialog.tsx` self-explanatory by attaching `InfoTooltip` to every field label, rewriting the Title placeholder with a concrete example, and clarifying how Linked Key Results + weights work. Also tighten the create-time status options to prevent bad data.

### File: `src/components/initiatives/CreateInitiativeDialog.tsx`

**Imports**
- Add: `import { InfoTooltip } from "@/components/ui/InfoTooltip";`

**Label updates** (each Label gains `className="flex items-center"` so the tooltip's icon sits inline):

- **Title** — tooltip: *"What you're going to do. An Initiative is a project or workstream that moves one or more Key Results. Example: 'Launch referral program for existing buyers.'"* Placeholder changed to `"e.g., Launch referral program for existing buyers"`.
- **Description** — tooltip: *"Optional scope, hypothesis, or context. Useful for teammates joining later."*
- **Status** — tooltip: *"Not Started (planned, not begun), In Progress (actively being worked on), Completed (done and shipped), Blocked (can't proceed until something else resolves)."*
- **Start Date** — tooltip: *"When work begins. Used in Timeline and Workload views."*
- **End Date** — tooltip: *"Target completion. Appears in Calendar and overdue lists."*
- **Linked Key Results** — rich tooltip content (multi-paragraph inside a single `<InfoTooltip>` body):
  - Lead: *"Which KRs this Initiative moves."*
  - Bulleted explanation: one Initiative can move multiple KRs; linking surfaces it on that KR's detail; weights (0–1) express uneven contribution; missing weights distribute evenly.
  - Example: *"A pricing page redesign might be weight 0.7 toward 'Increase conversion' and 0.3 toward 'Reduce bounce rate'."*

**Helper line below the KR picker**
Add directly under `<KRMultiSelect …/>` inside the same `grid gap-2`:
```tsx
<p className="text-xs text-muted-foreground">
  Each link has an optional weight. Leave weights blank to distribute impact evenly across linked KRs.
</p>
```

**Status SelectContent (CREATE only)**
Remove the `Completed` and `Blocked` `<SelectItem>`s. Keep `Not Started` and `In Progress`. The `EditInitiativeDialog` is untouched so the full lifecycle remains available after creation. No flag needed — this matches typical create-flow hygiene.

### Unchanged
`useState` shape, `handleSubmit`, `resetForm`, `KRMultiSelect`, dialog frame / footer, and all other files.

### Out of scope
No edits to `KRMultiSelect`, `useInitiatives`, or any other component. No styling-token changes.

