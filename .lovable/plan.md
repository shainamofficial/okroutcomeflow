

## Clarify Cadence vs Session in Reviews

Add explanatory copy and tooltips so users understand the Cadence (recurring rule) vs Session (instance) distinction. No structural changes.

### File 1: `src/components/reviews/ReviewStatusBadge.tsx`

Add tooltip explanations using the same pattern as `KRStatusBadge`. Extend `statusConfig` with an `explanation` field for each of the three actual statuses:

- **scheduled** — "A planned review instance. The KR owner should submit progress before this date; managers review it together."
- **completed** — "This review session happened and notes/updates were recorded. The next session was scheduled by the cadence."
- **cancelled** — "This specific session was skipped. The recurring cadence is unaffected — the next session will still fire."

Wrap the `Badge` in `Tooltip`/`TooltipTrigger`/`TooltipContent` with `cursor-help`, mirroring `KRStatusBadge` exactly (label in bold, explanation in muted).

### File 2: `src/pages/Reviews.tsx`

- Import `InfoTooltip` from `@/components/ui/InfoTooltip`.
- Replace the existing subtitle paragraph with: "Schedule recurring check-ins where KR owners report progress." (kept on the existing `<p>` element; preserves responsive `hidden sm:block`).
- Next to the `h1` "Reviews", add an `InfoTooltip` explaining the Cadence vs Session distinction:
  > "A Cadence is a recurring rule — e.g., 'every Monday at 10am'. Each time the rule fires, it creates a Session (one specific review instance). Owners submit updates; managers review them together."
  
  (Reviews page has no "create cadence" button — cadences are configured per-KR via `ReviewCadenceConfig`. The header tooltip is the right anchor here; the form-level tooltip lives in File 3.)
- In the Upcoming empty state, replace the current text:
  > "No review cadences yet. Reviews turn OKRs from a quarterly planning exercise into a weekly discipline. Start with a weekly cadence for your KR owners — it's the #1 driver of OKR adoption."

### File 3: `src/components/reviews/ReviewCadenceConfig.tsx`

- Import `InfoTooltip`.
- On the **Frequency** `Label`, add an `InfoTooltip`:
  > "How often the cadence fires. Weekly is best for tactical KRs; biweekly or monthly works for slower-moving strategic ones."
- On the `CardTitle` "Review Cadence", add an `InfoTooltip`:
  > "A Cadence is a recurring rule. Each time it fires, it creates a Session — one specific review instance with its own notes and status."

### Out of scope
- No schema, routing, hook, or session-logic changes.
- No edits to `Dashboard`, `OKRs`, KR detail panel layout, or other badges.

