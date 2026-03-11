

## Fix Timeline Color Picker Interaction & Task Color Display

### Bug 1: Color Picker Opens Task Drawer

**Root cause**: In `TimelineBar.tsx`, the entire bar div has `onMouseDown={(e) => handleMouseDown(e, "move")}` (line 265). When clicking the color picker button, the bar's `mousedown` fires first, setting `isDragging=true`. On `mouseup`, since no movement occurred, it triggers `onClick()` which opens the task drawer. The color picker only has `onClick={(e) => e.stopPropagation()}` — but that doesn't prevent the `mousedown` from being captured by the parent bar.

**Fix**: Add `onMouseDown={(e) => e.stopPropagation()}` to the `TimelineColorPicker` trigger button and popover content, so the bar's drag system never captures these interactions.

| File | Change |
|------|--------|
| `src/components/timeline/TimelineColorPicker.tsx` | Add `onMouseDown` stopPropagation to the Button trigger and PopoverContent |
| `src/components/timeline/TimelineMilestone.tsx` | Same fix for the milestone color picker (same pattern) |

### Bug 2: Task Bar Color Not Changing Visually

**Root cause**: In `getCustomColorClasses()` (timeline-colors.ts line 90-92), task colors use chained `.replace()`:
```js
config.bg.replace("-500", "-400").replace("-400", "-300")
```
This turns `-500` → `-400` → `-300` (double replacement). The resulting classes like `bg-red-300`, `bg-orange-300` etc. are dynamically constructed strings that Tailwind's JIT compiler never sees statically, so they get purged from the CSS bundle. The classes exist in code but not in the actual stylesheet.

**Fix**: Replace the string manipulation with an explicit `taskBg`/`taskHover` field in each color config entry, so all class names appear statically in the source.

| File | Change |
|------|--------|
| `src/lib/timeline-colors.ts` | Add `taskBg` and `taskHover` fields to each color config. Update `getCustomColorClasses` to use them directly instead of string replacement. |

