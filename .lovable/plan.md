

## Make the Timeline UI More Sleek, Modern, and Cool

### Current State
The timeline works well functionally but uses basic styling -- flat colors, simple borders, no depth or visual polish. The bars are plain rectangles, the header is a basic muted row, and there's no visual hierarchy or modern design flourishes.

### Proposed Visual Enhancements

#### 1. Gantt Bars -- Rounded, Gradient, Glassmorphism
- Add `rounded-full` (pill-shaped) bars instead of sharp-cornered rectangles
- Apply subtle gradient fills (e.g., `bg-gradient-to-r`) instead of flat solid colors
- Add a subtle `shadow-sm` and `backdrop-blur` to bars for depth
- Smooth the progress fill with a gradient overlay instead of a flat opacity block
- Add a thin left-border accent color on bars for visual punch

#### 2. Timeline Header -- Frosted Glass Effect
- Apply `backdrop-blur-md bg-background/80` to the sticky header for a frosted glass look
- Use a bottom `shadow-sm` instead of a hard border for the header row
- Style the "today" column highlight with a softer gradient glow instead of flat `bg-primary/10`

#### 3. Today Indicator -- Animated Glow Line
- Change the today line from a plain `w-0.5 bg-primary` to a glowing line with `shadow-[0_0_8px_var(--primary)]`
- Add a small pulsing dot at the top of the today line
- Use `bg-gradient-to-b from-primary to-primary/0` for a fade-out effect at the bottom

#### 4. Row Hover States -- Smooth Transitions
- Replace the flat `hover:bg-muted/20` with a smooth left-border accent that slides in on hover
- Add `transition-all duration-200` to rows for buttery smooth interactions

#### 5. Sticky Column -- Refined Sidebar Look
- Add a subtle right shadow (`shadow-[2px_0_8px_rgba(0,0,0,0.06)]`) to the sticky left column instead of a hard border, creating a floating sidebar effect
- Slightly increase font weight hierarchy (initiative titles bolder, tasks lighter)

#### 6. Filters Bar -- Pill-Shaped, Elevated
- Change the filter bar from `border rounded-lg bg-muted/30` to `rounded-xl shadow-card bg-card/80 backdrop-blur-sm border-0`
- Make filter selects use pill-shaped triggers with subtle backgrounds

#### 7. Chart Container -- Card Elevation
- Upgrade the outer container from `border rounded-lg` to `rounded-xl shadow-card overflow-hidden border-0`
- Add a very subtle top gradient bar (2px) in the primary color

#### 8. Weekend Columns -- Subtle Striping
- Use alternating very-light background stripes on weekend columns for visual rhythm (already partially done, enhance contrast slightly)

#### 9. Color Picker -- Animated Entrance
- Add `animate-scale-in` to the color picker popover for a polished feel

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/timeline/TimelineBar.tsx` | Pill shape, gradient fills, shadow, refined progress overlay |
| `src/components/timeline/TimelineChart.tsx` | Frosted header, glowing today line with pulse dot, card container, sticky column shadow |
| `src/components/timeline/TimelineRow.tsx` | Smooth hover transitions, refined sticky column styling |
| `src/components/timeline/TimelineFilters.tsx` | Pill-shaped elevated filter bar |
| `src/components/timeline/TimelineMilestone.tsx` | Add subtle glow/shadow to diamond icon |
| `src/components/timeline/TimelineColorPicker.tsx` | Animate popover entrance |

### No Backend Changes
All changes are purely CSS/Tailwind styling updates.

