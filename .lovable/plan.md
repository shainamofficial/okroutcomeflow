

# Add Owner/Assignee to Timeline View

## Overview

Enhance the timeline view to show owner/assignee information in a subtle, non-intrusive way. The information is already shown in the left panel labels, but we can make it more visible in two key places:

1. **Timeline bar tooltips** - Add owner/assignee to the hover tooltip
2. **Timeline bar labels** - Show initials as a small avatar or text when the bar is wide enough

---

## Approach Options

### Option A: Tooltip Only (Most Subtle)
Add owner/assignee to the existing tooltip that appears on hover. This keeps the UI clean while making the information easily accessible.

### Option B: Initials on Bar + Tooltip (Recommended)
Show owner/assignee initials as a small circle or text at the end of the bar, plus enhanced tooltip. This provides at-a-glance visibility without cluttering the view.

### Option C: Avatar on Bar + Tooltip
Show a small avatar image on the bar. More visual but requires more space.

---

## Recommended Implementation (Option B)

### Changes to TimelineBar.tsx

| Element | Change |
|---------|--------|
| Props | Add `ownerName?: string` for initiatives, `assigneeName?: string` for tasks |
| Bar content | Show initials circle on the right side of the bar (when width > 100px) |
| Tooltip | Add owner/assignee name below the date information |

### Changes to TimelineMilestone.tsx

| Element | Change |
|---------|--------|
| Props | Add `ownerName?: string` or `assigneeName?: string` |
| Tooltip | Add owner/assignee name to the tooltip |

### Changes to TimelineRow.tsx

| Element | Change |
|---------|--------|
| TimelineBar props | Pass owner/assignee name from initiative or task |
| TimelineMilestone props | Pass owner/assignee name from initiative or task |

---

## Visual Design

### Initials on Bar
```text
┌────────────────────────────────────────────────────┬───┐
│  Project Alpha                                     │JD │
└────────────────────────────────────────────────────┴───┘
```
- Small circle with initials at the right edge of the bar
- Muted/subtle background (e.g., slightly darker than bar)
- Only shown when bar width > 100px to avoid crowding

### Enhanced Tooltip
```text
┌────────────────────────────────┐
│ Project Alpha                  │
│ Jan 15, 2026 - Feb 28, 2026    │
│ 45 days                        │
│ ────────────────────────────── │
│ Owner: John Doe                │  <- NEW
└────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/timeline/TimelineBar.tsx` | Add `ownerName` prop, show initials on bar, add to tooltip |
| `src/components/timeline/TimelineMilestone.tsx` | Add `ownerName` prop, add to tooltip |
| `src/components/timeline/TimelineRow.tsx` | Pass owner/assignee names to TimelineBar and TimelineMilestone |

---

## Implementation Details

### Helper Function for Initials
```typescript
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};
```

### Initials Display
- Background: `bg-black/10` or `bg-white/20` (subtle)
- Text: Same as bar text color but slightly muted
- Size: `h-5 w-5` or smaller
- Position: Right side of bar, inside the resize handle area
- Hidden when bar is too narrow (< 100px)

### Tooltip Enhancement
Add a separator and owner/assignee line:
- For initiatives: "Owner: [Name]"
- For tasks: "Assignee: [Name/Team]" or "Unassigned" if none

