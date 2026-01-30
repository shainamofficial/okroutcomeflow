
# Move View Selector to Timeline Filters

## Overview

Move the Week/Month/Quarter zoom level selector from the page header into the TimelineFilters component, consolidating all view and filter controls in one place.

## Changes

### 1. Update TimelineFilters Component

Add the zoom level selector to the filters bar:

| Change | Details |
|--------|---------|
| New prop | Accept `zoomLevel` and `onZoomLevelChange` props |
| Add selector | Add a Select dropdown for Week/Month/Quarter options |
| Styling | Style it consistently with other filter dropdowns |

### 2. Update Timeline Page

Remove the tabs from the header and pass zoom level props to TimelineFilters:

| Change | Details |
|--------|---------|
| Remove Tabs | Remove the `<Tabs>` component from the header section |
| Clean up imports | Remove unused `Tabs` imports |
| Pass props | Pass `zoomLevel` and `onZoomLevelChange` to TimelineFilters |

## Visual Result

**Before:**
```text
+------------------------------------------+
| Timeline                    [Week|Month|Quarter] (tabs)
| Visualize initiatives...
+------------------------------------------+
| Filters: [Status] [Owner] [User] [Team]  |
+------------------------------------------+
```

**After:**
```text
+------------------------------------------+
| Timeline                                 |
| Visualize initiatives...                 |
+------------------------------------------+
| Filters: [View] [Status] [Owner] [User] [Team] |
+------------------------------------------+
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/timeline/TimelineFilters.tsx` | Add zoom level Select dropdown and new props |
| `src/pages/Timeline.tsx` | Remove Tabs from header, pass zoom props to TimelineFilters |

## Technical Details

**TimelineFilters.tsx changes:**
- Import `ZoomLevel` type from Timeline page
- Add new props: `zoomLevel: ZoomLevel` and `onZoomLevelChange: (level: ZoomLevel) => void`
- Add a new Select dropdown with options: Week, Month, Quarter
- Position it as the first filter (left side) for prominence

**Timeline.tsx changes:**
- Remove `Tabs`, `TabsList`, `TabsTrigger` imports and JSX
- Pass `zoomLevel={zoomLevel}` and `onZoomLevelChange={setZoomLevel}` to `<TimelineFilters />`
