

## Wrap KR Status Badge in Explanatory Tooltip

Add a hover tooltip to `KRStatusBadge` that explains what each status means. No other files change.

### File: `src/components/okrs/KRStatusBadge.tsx`

- Import `Tooltip`, `TooltipContent`, `TooltipTrigger` from `@/components/ui/tooltip`.
- Extend `statusConfig` entries from `{ label, variant }` → `{ label, variant, explanation }` with this copy:
  - **no_config** — "This KR has no metric configured yet. Click it and set up a metric (name, unit, start, target, dates) to start tracking progress."
  - **no_data** — "Metric is configured but no values have been logged yet. Add a metric value to see progress and status."
  - **on_track** — "Today's value is at or above the expected line for this date. At this pace, the KR will hit its target by the end date."
  - **at_risk** — "Behind the expected pace, but recoverable. Action is needed soon or this KR will slip into Off Track."
  - **off_track** — "Significantly behind the expected pace. Without intervention or a target change, this KR will not hit its goal."
- Wrap the `Badge` in `<Tooltip delayDuration={150}>` with `<TooltipTrigger asChild>`.
- Merge `"cursor-help"` into the Badge `className` via `cn`.
- `TooltipContent` uses `className="max-w-xs text-xs leading-relaxed"`. Inside: a `<p className="font-medium">{label}</p>` and below it a `<p className="text-muted-foreground">{explanation}</p>`.
- `KRStatus` type and variant mappings are unchanged.

### Out of scope
No other files touched. Component API (`status`, `className` props) unchanged.

