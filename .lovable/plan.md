

# Timeline Click-to-Open Detail Drawer

## Overview

Add click functionality to the Timeline view so clicking on an Initiative or Task opens the corresponding detail drawer (side panel). This provides quick access to full details, activity feeds, and management actions without leaving the timeline.

---

## Current State

The Timeline already has:
- `InitiativeDetailDrawer` - Full initiative details with linked KRs, tasks, and activity feed
- `TaskDetailDrawer` - Full task details with activity feed
- Timeline components (`TimelineRow`, `TimelineBar`, `TimelineMilestone`, `TimelineNoDates`) that display items but have no click handlers

---

## Implementation Approach

### What Will Be Clickable

| Location | Item Type | Opens |
|----------|-----------|-------|
| Timeline rows (left label area) | Initiative | InitiativeDetailDrawer |
| Timeline rows (left label area) | Task | TaskDetailDrawer |
| Timeline bars | Initiative | InitiativeDetailDrawer |
| Timeline bars | Task | TaskDetailDrawer |
| Timeline milestones | Initiative | InitiativeDetailDrawer |
| Timeline milestones | Task | TaskDetailDrawer |
| No Dates section cards | Initiative | InitiativeDetailDrawer |
| No Dates section items | Task | TaskDetailDrawer |

---

## User Experience

1. **Click anywhere on an initiative/task row label** - Opens the detail drawer
2. **Click on a timeline bar or milestone** - Opens the detail drawer (separate from drag interactions)
3. **Drag interactions remain unchanged** - Dragging still adjusts dates as before
4. **Visual feedback** - Cursor changes to pointer on clickable areas, hover states show interactivity

---

## Technical Details

### Click vs Drag Distinction

For `TimelineBar` and `TimelineMilestone`, we need to distinguish between:
- **Click**: Quick tap with no/minimal mouse movement - opens drawer
- **Drag**: Mouse down + movement - adjusts dates

This will be handled by tracking mouse movement distance and only triggering click if movement is below a threshold (e.g., 5 pixels).

### State Management

The `Timeline.tsx` page will manage:
- `selectedInitiative: Initiative | null` - Currently selected initiative for drawer
- `selectedTask: Task | null` - Currently selected task for drawer
- `initiativeDrawerOpen: boolean` - Initiative drawer visibility
- `taskDrawerOpen: boolean` - Task drawer visibility

### Props to Add

| Component | New Props |
|-----------|-----------|
| `TimelineRow` | `onInitiativeClick`, `onTaskClick` |
| `TimelineBar` | `onClick` |
| `TimelineMilestone` | `onClick` |
| `TimelineNoDates` | `onInitiativeClick`, `onTaskClick` |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Timeline.tsx` | Add drawer state, import drawers, pass click handlers |
| `src/components/timeline/TimelineRow.tsx` | Add click handlers to row labels, pass `onClick` to Bar/Milestone |
| `src/components/timeline/TimelineBar.tsx` | Add `onClick` prop, distinguish click from drag |
| `src/components/timeline/TimelineMilestone.tsx` | Add `onClick` prop, distinguish click from drag |
| `src/components/timeline/TimelineNoDates.tsx` | Add click handlers to initiative cards and task items |

---

## Implementation Steps

1. **Update TimelineBar.tsx**
   - Add `onClick` prop
   - Track mouse movement to distinguish click vs drag
   - Call `onClick` if movement < 5px on mouseup

2. **Update TimelineMilestone.tsx**
   - Add `onClick` prop
   - Same click vs drag logic as TimelineBar

3. **Update TimelineRow.tsx**
   - Add `onInitiativeClick` and `onTaskClick` props
   - Make initiative/task labels clickable with cursor-pointer
   - Pass `onClick` to TimelineBar and TimelineMilestone components

4. **Update TimelineNoDates.tsx**
   - Add `onInitiativeClick` and `onTaskClick` props
   - Make initiative cards and task items clickable

5. **Update Timeline.tsx (main page)**
   - Import `InitiativeDetailDrawer` and `TaskDetailDrawer`
   - Add state for selected items and drawer visibility
   - Pass click handlers to TimelineChart and TimelineNoDates
   - Render both drawers at the bottom of the component

