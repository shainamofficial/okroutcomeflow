

## Add Hover Tooltips to Sidebar Nav Items

Each item in `AppSidebar` will show a right-side tooltip with a short description of what that section does. Navigation logic, role gating, and styling stay identical.

### File: `src/components/app/AppSidebar.tsx`

- Import `Tooltip`, `TooltipContent`, `TooltipTrigger` from `@/components/ui/tooltip`. Also import the `LucideIcon` type from `lucide-react` to type the `icon` field.
- Define `type NavItem = { title: string; url: string; icon: LucideIcon; description: string }` and annotate `navItems`, `managerItems`, `adminItems`, and `platformItems` as `NavItem[]`.
- Add a `description` field to every entry, using the provided copy verbatim:
  - Dashboard, My Items, OKRs, Initiatives, Table, Timeline, Calendar, Workload, Reviews, Activity Log, Automations, Notifications
  - User Management, Teams
  - Organization Settings
  - Platform
- In `renderMenu`, wrap the existing `NavLink` (still inside `<SidebarMenuButton asChild>`) with:
  - `<Tooltip delayDuration={300}>`
  - `<TooltipTrigger asChild>` around the unchanged `NavLink` (same classes, icon, label)
  - `<TooltipContent side="right" className="max-w-xs text-xs leading-relaxed">` containing `<p className="font-medium">{item.title}</p>` and `<p className="text-muted-foreground">{item.description}</p>`

### Out of scope
No other files touched. Existing classes, role gating, group structure, and active-state styling remain identical. `TooltipProvider` is already mounted app-wide.

