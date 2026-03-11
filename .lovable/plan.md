

## Timeline UI Improvements Inspired by ClickUp

After comparing your current timeline with ClickUp's Gantt view, here are the meaningful improvements worth implementing. Your timeline already has strong fundamentals (pill bars, glassmorphism, drag/resize, dependency arrows, color picker, density modes). These additions target the gaps.

### 1. Two-Tier Date Header
ClickUp uses a dual-row header: a top row showing the broader range (e.g., "Mar 30 – Apr 5, W13") and a bottom row with individual day columns. Currently you have a single header row.

- Add a top "super-header" row that groups columns (e.g., month name spanning its weeks, or week range spanning its days)
- Only applies when zoom is "day" or "week" — at month/quarter zoom it stays single-tier

**File**: `TimelineChart.tsx` — add a grouped header row above the existing column headers.

### 2. "Autofit" Button (Zoom to Fit)
ClickUp has an "Autofit" button that adjusts zoom so all items fit in the viewport. Currently you only have manual zoom levels.

- Add an "Autofit" button next to "Today" in the toolbar
- Calculates the optimal zoom level based on the date range of all visible items vs viewport width

**Files**: `TimelineFilters.tsx` (add button), `TimelineChart.tsx` (expose `autofit` via imperative handle)

### 3. "Me Mode" Quick Toggle
ClickUp has a one-click "Me mode" that filters to only items assigned to or owned by the current user. Currently this requires setting multiple filter dropdowns.

- Add a toggle button with a user icon in the toolbar
- When active, filters to initiatives owned by current user OR tasks assigned to current user
- Much faster than manually selecting from owner/assignee dropdowns

**Files**: `TimelineFilters.tsx` (add toggle), `Timeline.tsx` (filter logic)

### 4. Date Labels on Bar Edges
ClickUp shows start/end dates near the bar edges on hover — not just in tooltips. This gives faster visual feedback.

- On hover, show small date chips (`Mar 5` / `Apr 12`) floating at the left and right edges of the bar
- Only visible on hover, disappears cleanly

**File**: `TimelineBar.tsx` — add absolutely positioned date labels that appear on `group-hover`.

### 5. % Complete on Bars
ClickUp shows completion percentage directly on initiative bars. You have a progress gradient fill but no visible number.

- Show a small `67%` label on the right side of initiative bars (when width allows)
- Replaces the need to hover for progress info

**File**: `TimelineBar.tsx` — add a progress label element.

### 6. Row Count Badge on Groups
When grouping is active, ClickUp shows item counts prominently. Your current implementation shows counts in parentheses but they're subtle.

- Style the group count as a small `Badge` component instead of plain text

**File**: `Timeline.tsx` — use `<Badge>` for group counts.

### Summary of Changes

| File | Change |
|------|--------|
| `TimelineChart.tsx` | Two-tier header, autofit handle |
| `TimelineFilters.tsx` | Autofit button, Me Mode toggle |
| `TimelineBar.tsx` | Hover date labels on edges, % label on bar |
| `Timeline.tsx` | Me Mode filter logic, Badge on group counts |

All changes are frontend-only — no backend modifications needed.

