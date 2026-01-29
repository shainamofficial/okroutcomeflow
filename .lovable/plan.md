
# Add Semantic Colors Throughout the Application

This plan enhances the application's usability by adding meaningful, semantic colors to status indicators, progress elements, charts, timeline bars, and role badges.

## Overview

The current Notion-like monochromatic design is elegant but makes it difficult to quickly distinguish between statuses. We'll add a semantic color system that:
- Uses **green** for positive/completed states
- Uses **blue** for active/in-progress states  
- Uses **amber/yellow** for warning/at-risk states
- Uses **red** for blocked/off-track states
- Uses **gray** for neutral/not-started states

## 1. CSS Variable Updates

Add new semantic color variables to `index.css`:

| Variable | Light Mode (HSL) | Dark Mode (HSL) | Usage |
|----------|------------------|-----------------|-------|
| `--success` | 142 76% 36% | 142 76% 40% | On track, completed, done |
| `--success-foreground` | 0 0% 100% | 0 0% 100% | Text on success |
| `--warning` | 38 92% 50% | 38 92% 50% | At risk |
| `--warning-foreground` | 0 0% 9% | 0 0% 9% | Text on warning |
| `--info` | 217 91% 60% | 217 91% 60% | In progress |
| `--info-foreground` | 0 0% 100% | 0 0% 100% | Text on info |
| `--chart-1` to `--chart-5` | Various | Various | Chart colors |

## 2. Badge Component Enhancement

Update the Badge component to support new color variants:

**New variants to add:**
- `success` - Green background for completed/on-track
- `warning` - Amber background for at-risk
- `info` - Blue background for in-progress

```text
Badge Variants
+-------------+------------------------+
| Variant     | Appearance             |
+-------------+------------------------+
| default     | Primary (dark gray)    |
| secondary   | Light gray background  |
| destructive | Red background         |
| outline     | Border only, no fill   |
| success     | Green background       |
| warning     | Amber background       |
| info        | Blue background        |
+-------------+------------------------+
```

## 3. Status Badge Updates

### Task Status Badge
| Status | Current | New |
|--------|---------|-----|
| To Do | outline (gray) | outline (gray) - no change |
| In Progress | default (dark) | info (blue) |
| Blocked | destructive (red) | destructive (red) - no change |
| Done | secondary (gray) | success (green) |

### Initiative Status Badge
| Status | Current | New |
|--------|---------|-----|
| Not Started | outline (gray) | outline (gray) - no change |
| In Progress | default (dark) | info (blue) |
| Completed | secondary (gray) | success (green) |
| Blocked | destructive (red) | destructive (red) - no change |

### KR Status Badge
| Status | Current | New |
|--------|---------|-----|
| No Config | outline (gray) | outline (gray) - no change |
| No Data | secondary (gray) | secondary (gray) - no change |
| On Track | default (dark) | success (green) |
| At Risk | accent (gray) | warning (amber) |
| Off Track | destructive (red) | destructive (red) - no change |

### Review Status Badge
| Status | Current | New |
|--------|---------|-----|
| Scheduled | outline (gray) | info (blue) |
| Completed | secondary (gray) | success (green) |
| Cancelled | destructive (red) | destructive (red) - no change |

## 4. Progress Bar Enhancement

Create a color-coded progress bar that changes color based on performance:

**Logic:**
- **Green** when actual progress >= expected progress
- **Amber** when slightly behind (within 20% of expected)
- **Red** when significantly behind (>20% below expected)

Update `KRProgressBar.tsx` to:
1. Accept `expectedProgress` as a prop
2. Calculate the gap between actual and expected
3. Apply appropriate color class to the Progress indicator

## 5. Chart Color System

Add `--chart-*` CSS variables for consistent data visualization:

| Variable | Color | Usage |
|----------|-------|-------|
| `--chart-1` | Red (0 84% 60%) | Off track / Behind |
| `--chart-2` | Green (142 76% 36%) | On track |
| `--chart-3` | Blue (217 91% 60%) | Neutral / Info |
| `--chart-4` | Amber (38 92% 50%) | At risk |
| `--chart-5` | Gray (0 0% 45%) | No data |

Update `KRStatusChart.tsx` to use these defined variables.

## 6. Timeline Bar Colors

Update timeline bars to use semantic colors based on status:

**Initiatives:**
- Not Started: Gray
- In Progress: Blue
- Completed: Green
- Blocked: Red

**Tasks:**
- To Do: Gray (lighter)
- In Progress: Blue (lighter)
- Done: Green (lighter)
- Blocked: Red (lighter)

## 7. Role Badge Colors

Update role badges in `UserTable.tsx` and `GlobalUsersTable.tsx`:

| Role | Current | New |
|------|---------|-----|
| Admin | default (dark) | Custom purple/indigo |
| Manager | secondary (gray) | info (blue) |
| Contributor | outline (gray) | success (green) |
| Viewer | outline (gray) | outline (gray) - no change |

## 8. User Status Indicators

Add colored indicators for user status:

| Status | Color |
|--------|-------|
| Active | Green dot |
| Pending | Amber dot |
| Inactive | Gray dot |

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Add chart color variables |
| `src/tailwind.config.ts` | Add success, warning, info color mappings |
| `src/components/ui/badge.tsx` | Add success, warning, info variants |
| `src/components/tasks/TaskStatusBadge.tsx` | Update variant mappings |
| `src/components/initiatives/InitiativeStatusBadge.tsx` | Update variant mappings |
| `src/components/okrs/KRStatusBadge.tsx` | Update variant mappings |
| `src/components/reviews/ReviewStatusBadge.tsx` | Update variant mappings |
| `src/components/okrs/KRProgressBar.tsx` | Add color-coded progress indicator |
| `src/components/ui/progress.tsx` | Support color variants |
| `src/components/dashboard/KRStatusChart.tsx` | Use defined chart colors |
| `src/components/timeline/TimelineBar.tsx` | Add status-based coloring |
| `src/components/users/UserTable.tsx` | Update role badge colors |
| `src/components/platform/GlobalUsersTable.tsx` | Update role badge colors, add status dots |

## Implementation Order

1. **CSS variables** - Add all new color definitions
2. **Tailwind config** - Map new colors
3. **Badge component** - Add new variants
4. **Status badges** - Update all four badge components
5. **Progress bar** - Add color-coded logic
6. **Charts** - Update chart colors
7. **Timeline** - Add status-based coloring
8. **Role/User indicators** - Final polish

## Visual Preview

```text
Before (Monochrome):
┌─────────────────────────────────────┐
│ [■ In Progress] [■ Done] [■ Blocked]│  <- All look similar
│ ████████░░░░░░░░░░░░░ 40%           │  <- Single color progress
└─────────────────────────────────────┘

After (Semantic Colors):
┌─────────────────────────────────────┐
│ [🔵 In Progress] [🟢 Done] [🔴 Blocked]│  <- Instantly recognizable
│ ████████░░░░░░░░░░░░░ 40% 🟡        │  <- Yellow = slightly behind
└─────────────────────────────────────┘
```
