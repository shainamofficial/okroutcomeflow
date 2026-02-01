

# Plan: Custom Colors for Timeline Gantt Bars

## Overview
Add the ability for users to customize the color of Gantt chart bars for initiatives and tasks in the timeline view. Users will be able to pick from a predefined color palette when viewing or editing an item.

## Current Behavior
- Initiative bars are colored based on their status (not_started, in_progress, completed, blocked)
- Task bars use lighter variants of the same status colors
- Colors are hardcoded in the `getStatusColor` function in `TimelineBar.tsx`
- There is no way for users to override these colors

## Proposed Changes

### 1. Database Schema Changes
Add a `color` column to both `initiatives` and `tasks` tables to store the user's custom color choice.

**SQL Migration:**
```text
ALTER TABLE initiatives ADD COLUMN color text;
ALTER TABLE tasks ADD COLUMN color text;
```

The color will be stored as a simple identifier (e.g., "red", "blue", "green") that maps to predefined CSS classes.

### 2. Define Color Palette
Create a set of 8-10 predefined colors that work well in both light and dark themes. Colors will be defined using Tailwind classes for consistency.

**Proposed Colors:**
- Default (uses status-based coloring)
- Red
- Orange  
- Yellow
- Green
- Teal
- Blue
- Purple
- Pink
- Gray

### 3. Create Color Picker Component
Build a reusable `ColorPicker` component that displays the available colors as clickable swatches.

**File:** `src/components/timeline/TimelineColorPicker.tsx`

Features:
- Grid of color swatches
- Current selection indicator
- "Default" option to revert to status-based coloring
- Accessible with proper focus states

### 4. Update TimelineBar Component
Modify `TimelineBar.tsx` to accept an optional `customColor` prop and use it instead of status-based colors when provided.

**Changes:**
- Add `customColor` prop to interface
- Update color logic: if `customColor` is set, use the custom color mapping; otherwise fall back to status-based colors
- Create a `getCustomColor` function that maps color identifiers to Tailwind classes

### 5. Update TimelineRow Component
Pass the custom color from initiative/task data to the TimelineBar and TimelineMilestone components.

### 6. Add Color Selection UI
Add color picker to the timeline view. Users can access it through:
- A context menu (right-click) on a bar
- A color button that appears on hover

This approach allows quick color changes without opening the full edit dialog.

### 7. Update Data Hooks
Modify `useInitiatives` and `useTasks` hooks to support the new `color` field in create/update operations.

### 8. Update Initiative and Task Interfaces
Add the `color` field to TypeScript interfaces for proper type safety.

---

## Technical Details

### Color Mapping
```text
TIMELINE_COLORS = {
  red: { bg: "bg-red-500", hover: "bg-red-600", text: "text-white" },
  orange: { bg: "bg-orange-500", hover: "bg-orange-600", text: "text-white" },
  yellow: { bg: "bg-yellow-400", hover: "bg-yellow-500", text: "text-gray-900" },
  green: { bg: "bg-green-500", hover: "bg-green-600", text: "text-white" },
  teal: { bg: "bg-teal-500", hover: "bg-teal-600", text: "text-white" },
  blue: { bg: "bg-blue-500", hover: "bg-blue-600", text: "text-white" },
  purple: { bg: "bg-purple-500", hover: "bg-purple-600", text: "text-white" },
  pink: { bg: "bg-pink-500", hover: "bg-pink-600", text: "text-white" },
  gray: { bg: "bg-gray-400", hover: "bg-gray-500", text: "text-white" },
}
```

### Context Menu Approach
Using a Popover triggered on click of a small color dot icon that appears on hover:
- Less intrusive than right-click context menu
- Works on touch devices
- Provides immediate visual feedback

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/` | Add `color` column to `initiatives` and `tasks` tables |
| `src/components/timeline/TimelineColorPicker.tsx` | New component for color selection UI |
| `src/components/timeline/TimelineBar.tsx` | Accept custom color prop, update color logic |
| `src/components/timeline/TimelineMilestone.tsx` | Accept custom color prop for milestones |
| `src/components/timeline/TimelineRow.tsx` | Pass color data, add color picker trigger |
| `src/hooks/useInitiatives.ts` | Add color to interface and update/create mutations |
| `src/hooks/useTasks.ts` | Add color to interface and update/create mutations |
| `src/pages/Timeline.tsx` | Import and use updated components |

---

## User Experience

1. **Viewing the timeline**: Bars display with their custom color (if set) or status-based color (default)

2. **Changing color**: 
   - Hover over a bar to reveal a small color indicator button
   - Click the button to open a color picker popover
   - Select a color from the palette
   - Bar immediately updates to new color
   - Color is saved to database

3. **Resetting to default**: Select "Default" option in the color picker to remove custom color and revert to status-based coloring

4. **Visual hierarchy**: Initiative bars remain fully opaque while task bars use slightly lighter variants of the same colors

