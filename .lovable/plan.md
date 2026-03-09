

## Timeline View: Assessment and Improvement Plan

### Current State
The timeline has a solid foundation: Gantt-style bars with drag-to-move/resize, milestones, color customization, today indicator, zoom levels (week/month/quarter), filters, and click-to-open drawers. However, compared to Jira's timeline, several critical capabilities are missing.

### What Jira Has That We Don't

1. **No dependency arrows** -- Jira draws visual lines between linked items. We have a `task_dependencies` table but zero visualization.
2. **No "scroll to today" button** -- Users with wide timelines have no way to jump to the current date.
3. **No progress indicators on bars** -- Jira shows completion percentage directly on the bar. Our bars are flat colored blocks.
4. **No inline creation** -- Jira lets you click "+" to create a task directly on the timeline row. We require navigating away.
5. **No row reordering or grouping** -- Jira can group by status, assignee, or priority. We show a flat list of initiatives.
6. **No "day" zoom level** -- Jira supports zooming all the way down to individual days.
7. **No keyboard navigation** -- No arrow keys to move between rows, no shortcuts.
8. **No drag to create** -- Jira lets you drag on an empty row to set start/end dates for a dateless item.
9. **Task dependencies not visualized** -- The DB table exists but the UI is completely missing.
10. **No critical path highlighting** -- No way to see which chain of tasks determines the timeline.
11. **Bar height is fixed at h-6** -- For dense timelines, bars feel cramped and small.

### Improvements to Implement (Ordered by Impact)

#### 1. Dependency Arrows Between Tasks
Draw SVG connector lines between tasks that have dependencies. This is the single biggest Gantt differentiator.
- Query `task_dependencies` table alongside tasks
- Render an SVG overlay layer in `TimelineChart` that draws curved/angled lines between dependent bars
- Color code: red for blocking, gray for waiting-on
- Show arrow direction (from blocker to blocked)

#### 2. Progress Bar Inside Gantt Bars
Show task/initiative completion as a filled portion of the bar.
- For initiatives: calculate `done tasks / total tasks` percentage
- For tasks with subtasks: calculate `done subtasks / total subtasks`
- Render an inner `div` with reduced opacity filling from left to right
- Display percentage text on hover tooltip

#### 3. Scroll-to-Today Button
A floating button that scrolls the timeline to center on today's date.
- Add a small "Today" button in the header area
- On click, programmatically scroll the `ScrollArea` to position the today indicator in view
- Use `containerRef` already available in `TimelineChart`

#### 4. "Day" Zoom Level
Add a day-level zoom for granular planning.
- Add `"day"` to `ZoomLevel` type
- Each column = 1 day, `colWidth = 40px`
- Use `eachDayOfInterval` from date-fns
- Format header as "Mon 9" (day of week + date)

#### 5. Inline Task Creation on Timeline
Add a "+" button on each initiative row to create a task inline.
- Show a "+" icon on hover at the end of the initiative's sticky left column
- Click opens a minimal inline form (just title + Enter to create)
- Task inherits the initiative's date range as defaults

#### 6. Group-By Toggle
Let users group rows by Status, Owner, or Team instead of just flat initiative list.
- Add a "Group by" select in filters: None, Status, Owner, Team
- When grouped, render group headers with collapse/expand
- Each group shows its initiatives/tasks underneath

#### 7. Drag-to-Create Dates
Allow dragging on empty timeline area of a dateless item to set its dates.
- For items in "No Dates" section, show them as empty rows in the chart
- User can click+drag on the empty row area to define a date range
- On release, calls `updateInitiative` or `updateTask` with the new dates

#### 8. Compact/Comfortable View Toggle
Let users switch between compact (smaller bars, more items visible) and comfortable (current size).
- Add a density toggle button (two horizontal lines icon)
- Compact: `h-4` bars, tighter row padding
- Comfortable: current `h-6` bars

#### 9. Row Height Auto-Expansion for Overlapping Tasks
When multiple tasks in an initiative overlap date ranges, stack them vertically rather than overlapping.
- Calculate date overlaps between sibling tasks
- Assign "lanes" to avoid visual collisions
- Increase row height dynamically based on number of lanes needed

### Files to Modify
- `src/components/timeline/TimelineChart.tsx` -- dependency SVG layer, scroll-to-today, grouping
- `src/components/timeline/TimelineRow.tsx` -- inline creation, progress bars, lane stacking
- `src/components/timeline/TimelineBar.tsx` -- progress fill, compact mode
- `src/components/timeline/TimelineFilters.tsx` -- day zoom, group-by selector, density toggle
- `src/components/timeline/TimelineDependencyArrows.tsx` -- new component for SVG arrows
- `src/hooks/useTaskDependencies.ts` -- new hook to fetch dependency data
- `src/pages/Timeline.tsx` -- integrate grouping logic, dependency data

### Database
- No schema changes needed. The `task_dependencies` table already exists with proper RLS.

### Priority Order

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 1 | Dependency arrows | Medium | Highest -- core Gantt feature |
| 2 | Progress bars on Gantt bars | Small | High -- instant visual feedback |
| 3 | Scroll-to-today button | Small | High -- essential navigation |
| 4 | Day zoom level | Small | Medium -- granular planning |
| 5 | Inline task creation | Small | Medium -- workflow speed |
| 6 | Group-by toggle | Medium | Medium -- organization |
| 7 | Drag-to-create dates | Medium | Medium -- UX polish |
| 8 | Compact/comfortable toggle | Small | Low -- density preference |
| 9 | Lane stacking for overlaps | Medium | Low -- visual clarity |

This set of improvements would put the timeline ahead of Jira's by adding dependency visualization, progress tracking, and inline creation -- three areas where Jira's timeline is already strong but where we can execute with better UX (e.g., color-coded dependency arrows, drag-to-create date ranges).

