

## Analysis: What's Missing vs monday.com / ClickUp

**Currently built:** Dashboard, My Items, OKRs, Initiatives (Board/List), Table View, Timeline, Calendar, Workload, Reviews, Activity Log, Automations, File Attachments, Teams, User Management, Notifications, Global Search, Org Settings.

**High-impact gaps** that would make this genuinely competitive:

---

### 1. Custom Fields on Initiatives & Tasks
monday.com's killer feature. Let users add Priority, Tags/Labels, Custom Dropdowns, Numbers, etc. to any item without schema changes.

- Add a `custom_field_definitions` table (org-scoped: name, field_type enum, options jsonb)
- Add a `custom_field_values` table (entity_type, entity_id, field_definition_id, value jsonb)
- Render inline in Table View with editable cells
- Filter/group by custom fields

### 2. Inline Editing in Table View
Currently read-only. monday.com lets you click any cell and edit in place.

- Make title, status, assignee, dates all click-to-edit in the Table View
- Use popovers for date pickers and dropdowns for selects
- Optimistic updates via existing `updateTask` mutations

### 3. Subtasks / Task Dependencies
ClickUp's differentiator. Tasks can have child tasks and blocking relationships.

- Add `parent_task_id` column to `tasks` table
- Add `task_dependencies` table (task_id, depends_on_task_id, type: blocks/waiting_on)
- Show subtask progress on parent tasks
- Visualize dependencies on Timeline view

### 4. Multiple Assignees & Watchers
monday.com supports multiple people per item.

- Add `task_watchers` table (task_id, user_id)
- Watchers get notifications on changes
- Show avatar stacks on cards

### 5. Recurring Tasks
Both competitors have this.

- Add `recurrence_rule` jsonb column to tasks (frequency, interval, end_date)
- Backend function to auto-create next occurrence when task is completed

### 6. Dashboard Customization (Drag-and-Drop Widgets)
monday.com dashboards are fully customizable.

- Add `dashboard_widgets` table (user_id, widget_type, position, config jsonb)
- Use `react-resizable-panels` (already installed) for layout
- Let users add/remove/reorder stat cards, charts, task lists

### 7. Dark Mode Toggle
Both competitors support it. The app already uses CSS variables.

- Add theme toggle in header using `next-themes` (already installed)
- Switch between light/dark with persisted preference

### 8. Keyboard Shortcuts & Command Palette
ClickUp's power-user feature.

- Enhance existing Global Search into a full command palette (Cmd+K)
- Add shortcuts: N for new task, G+D for go to dashboard, etc.

### 9. Email/In-App Notification Preferences
- Add `notification_preferences` table (user_id, type, email_enabled, in_app_enabled)
- Settings page for users to configure which events trigger notifications

### 10. Export & Reporting
- CSV export for Table View data
- PDF summary reports for OKRs with progress snapshots

---

### Recommended Implementation Order (by impact)

| Priority | Feature | Effort |
|----------|---------|--------|
| 1 | Dark mode toggle | Small |
| 2 | Inline editing in Table View | Medium |
| 3 | Subtasks & dependencies | Medium |
| 4 | Custom fields | Large |
| 5 | Command palette (Cmd+K) | Small |
| 6 | Multiple assignees & watchers | Medium |
| 7 | CSV/PDF export | Small |
| 8 | Recurring tasks | Medium |
| 9 | Dashboard customization | Large |
| 10 | Notification preferences | Medium |

### Technical Notes
- `next-themes` is already installed for dark mode
- `cmdk` is already installed for command palette
- `react-resizable-panels` is already installed for dashboard grid
- Custom fields require 2 new DB tables + a migration
- Subtasks require 1 new column + 1 new table

This set of features would close the biggest UX gaps with monday.com and ClickUp. I'd recommend starting with dark mode + inline table editing + command palette (all small-medium effort, high perceived value), then moving to subtasks and custom fields.

