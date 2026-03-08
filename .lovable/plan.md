

## Mobile Optimization Plan

The app currently uses fixed-width elements, horizontal filter bars, and large headings that don't adapt well to small screens. Here's what needs to change:

### 1. AppLayout -- reduce padding on mobile
- Change `main` padding from `p-6 lg:p-8` to `p-3 sm:p-6 lg:p-8`

### 2. AppHeader -- compact for mobile
- Hide command palette text on small screens (icon-only trigger)
- Reduce header horizontal padding on mobile

### 3. Page headers -- responsive titles and action bars
Apply across all major pages (Dashboard, OKRs, Initiatives, TableView, Timeline, MyItems, Workload, Reviews, Automations, etc.):
- Reduce `text-3xl` headings to `text-xl sm:text-3xl`
- Stack header title and action buttons vertically on mobile (`flex-col sm:flex-row`)
- Hide subtitle text on very small screens where space is tight

### 4. Filter bars -- collapsible on mobile
For `TimelineFilters`, `InitiativeFilters`, and TableView toolbar:
- Wrap filters in a collapsible section on mobile with a "Filters" toggle button
- Make select triggers full-width on mobile (`w-full sm:w-[140px]`)

### 5. TableView -- card-based mobile layout
The spreadsheet table is unusable on small screens. On mobile:
- Switch from `<Table>` to a stacked card layout showing task title, status badge, assignee, and due date
- Keep the table for `sm:` and above

### 6. MyItems tabs -- scrollable tab strip
- Make `TabsList` horizontally scrollable on mobile instead of wrapping/overflowing
- Reduce tab text size and hide icons on very small screens

### 7. Dashboard -- single column on mobile
- Stats grid: `grid-cols-2` on mobile (already `md:grid-cols-2 lg:grid-cols-4`, just needs `grid-cols-2` base)
- Charts: stack to single column on mobile (already mostly handled)

### 8. Initiatives Board View -- horizontal scroll
- The 4-column board grid needs `overflow-x-auto` with `min-w` columns on mobile, or switch to single-column stacked view

### 9. Landing page -- verify responsive
- Quick check that hero section, feature grid, and CTA sections use responsive utilities (likely already OK with framer-motion)

### 10. Drawers/Sheets -- full-width on mobile
- Ensure detail drawers (`TaskDetailDrawer`, `InitiativeDetailDrawer`, `KRDetailPanel`) use full viewport width on mobile

---

### Files to modify
- `src/components/app/AppLayout.tsx` -- mobile padding
- `src/components/app/AppHeader.tsx` -- compact header
- `src/pages/Dashboard.tsx` -- responsive grid
- `src/pages/OKRs.tsx` -- responsive header
- `src/pages/Initiatives.tsx` -- responsive header + board
- `src/pages/TableView.tsx` -- mobile card view + responsive toolbar
- `src/pages/Timeline.tsx` -- responsive header
- `src/pages/MyItems.tsx` -- scrollable tabs
- `src/pages/Workload.tsx` -- responsive header
- `src/components/timeline/TimelineFilters.tsx` -- collapsible mobile filters
- `src/components/initiatives/InitiativeFilters.tsx` -- collapsible mobile filters
- `src/components/initiatives/BoardView.tsx` -- mobile scroll/stack
- `src/components/search/CommandPalette.tsx` -- compact mobile trigger

No database changes required. Pure UI/Tailwind adjustments.

