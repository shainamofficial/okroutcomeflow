
# Fix Sidebar Z-Index Issue on Timeline Scroll

## Problem

When scrolling the timeline horizontally, the timeline content moves over the sidebar instead of staying contained within its area. This happens because:

1. The sidebar has `z-index: 10` (from the UI component library)
2. The timeline's sticky "Item" column header has `z-index: 20`
3. The main content area doesn't contain the horizontal overflow properly

## Solution

Add `overflow-hidden` to the main content area in `AppLayout.tsx`. This creates a proper stacking context and ensures the timeline's horizontal scroll is contained within its boundaries, preventing it from overlapping the sidebar.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/app/AppLayout.tsx` | Add `overflow-hidden` to the flex-1 content container |

## Technical Details

The fix adds `overflow-hidden` to the content wrapper div. This:
- Creates a containing block for the timeline's horizontal scroll
- Prevents the timeline from visually extending beyond its container
- Keeps the sidebar always visible on top regardless of scroll position

```tsx
// Before
<div className="flex-1 flex flex-col">

// After  
<div className="flex-1 flex flex-col overflow-hidden">
```

The `overflow-hidden` ensures that all child content (including the horizontally scrollable timeline) stays within the bounds of the main content area and cannot visually overlap the fixed sidebar.
