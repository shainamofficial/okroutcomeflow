

## Add Educational InfoTooltips to OKR Forms

Add contextual help (info icons) to the three OKR creation/configuration forms using the existing `InfoTooltip` component. No form logic, state, or submission handlers change.

### Files

**1. `src/components/okrs/CreateObjectiveDialog.tsx`**
- Import `DialogDescription` and `InfoTooltip`.
- Add `DialogDescription` under the title: *"A qualitative, inspirational statement of what you want to achieve this cycle. You'll add measurable Key Results under it in the next step."*
- Title `Label` → `className="flex items-center"` + `InfoTooltip` with rich JSX: explains good Objectives are qualitative, ambitious, time-bound, meaningful; lists examples ("Become the preferred marketplace for US jewelers", "Delight customers with a world-class checkout").
- Title `Input` placeholder → `"e.g., Become the preferred marketplace for US jewelers"`.
- Description `Label` → `className="flex items-center"` + `InfoTooltip` about adding "why" context.
- Description `Textarea` placeholder → `"Why this objective matters and who it's for"`.

**2. `src/components/okrs/CreateKeyResultDialog.tsx`**
- Imports: `DialogDescription`, `Alert`, `AlertDescription`, `GitBranch`, `InfoTooltip`.
- Add `const isSubKR = Boolean(parentKrId)`; reuse for title text.
- `DialogDescription` text branches on `isSubKR` (sub-KR vs. parent KR copy as specified).
- When `isSubKR`, render an `Alert` with `GitBranch` icon above the form; `AlertDescription` (text-xs) with bold `<strong>Sub-KR:</strong>` lead-in.
- Title `Label` → flex items-center + `InfoTooltip` with verb→number rule, good examples (MAB 200→500, checkout drop-off 38%→20%) and bad examples ("Launch new checkout" = initiative, "Improve buyer growth" = not measurable).
- Title `Input` placeholder → `"e.g., Grow monthly active buyers from 200 to 500"`.
- Description `Label` → flex items-center + `InfoTooltip` about optional context, definitions, caveats.
- Description `Textarea` placeholder → `"How is this measured? Any caveats?"`.
- Owner `Label` → flex items-center + `InfoTooltip` about single accountable point of contact.

**3. `src/components/okrs/MetricConfigForm.tsx`**
- Import `InfoTooltip`.
- Above the first grid, add a helper banner:
  ```tsx
  <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
    Configuring a metric lets the app calculate progress automatically. Progress moves linearly from <strong>Start Value</strong> to <strong>Target Value</strong> between the start and end dates, and status is based on how close today's value is to that line.
  </div>
  ```
- Add `className="flex items-center"` + `InfoTooltip` to each label:
  - **Metric Name** — "the thing you're measuring", examples MRR, Active Buyers, NPS, Checkout Conversion. Placeholder → `"e.g., Monthly Active Buyers"`.
  - **Unit** — "how the metric is counted", examples USD, %, users, NPS, hours, ms.
  - **Direction** — bulleted list: Increase (higher better), Decrease (lower better), Maintain (band).
  - **Start Value** — baseline = 0% progress; example MAU = 200.
  - **Target Value** — end-date target = 100% progress; example MAU = 500.
  - **Start Date** — when tracking begins; linear expectation between dates.
  - **End Date** — deadline; "On Track" definition; usually end of quarter.

### Out of scope
No other files modified. No barrel/index files updated. No changes to validation, submission, or state.

