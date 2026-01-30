
# Fix Timeline Initiative Column Z-Index

## Problem

When scrolling the timeline horizontally to the right, the date headers (Jan 2026, Feb 2026, etc.) display on top of the sticky initiative/task name column. The user expects the initiative names column to always stay on top when scrolling.

## Root Cause

Both the header row and the sticky initiative column have the same z-index:

| Element | Current Z-Index |
|---------|----------------|
| Header row with dates | `z-10` |
| Sticky "Item" header cell | `z-20` |
| Sticky initiative/task name column | `z-10` |

When scrolling right, the header date cells overlap the initiative column because they're at the same z-level and the header comes earlier in the DOM.

## Solution

Increase the z-index of the sticky left columns in `TimelineRow.tsx` so they render above the header:

| Element | New Z-Index |
|---------|-------------|
| Sticky initiative name column | `z-20` (was `z-10`) |
| Sticky task name column | `z-20` (was `z-10`) |

This ensures the initiative names are always visible on top when scrolling horizontally.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/timeline/TimelineRow.tsx` | Update z-index on sticky left columns from `z-10` to `z-20` |

## Technical Details

**Line 93 - Initiative row sticky column:**
```tsx
// Before
<div className="w-64 min-w-64 p-2 border-r sticky left-0 bg-background z-10 ...">

// After
<div className="w-64 min-w-64 p-2 border-r sticky left-0 bg-background z-20 ...">
```

**Line 188 - Task row sticky column:**
```tsx
// Before
<div className="w-64 min-w-64 p-2 pl-10 border-r sticky left-0 bg-background z-10 ...">

// After
<div className="w-64 min-w-64 p-2 pl-10 border-r sticky left-0 bg-background z-20 ...">
```

## Z-Index Hierarchy (After Fix)

```text
z-20: Sticky "Item" header cell (top-left corner)
z-20: Sticky initiative/task name columns (left side)
z-10: Header row with date columns
z-10: Today indicator line
```

This ensures the left column stays on top of the scrolling date headers.
