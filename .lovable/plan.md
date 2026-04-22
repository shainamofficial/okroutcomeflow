

## Move Dashboard Counts Server-Side

Stop fetching full `initiatives` and `tasks` row sets just to count them. Compute all distributions via Supabase `count: "exact", head: true` queries inside `useDashboardStats`, and read the results from the existing `stats` object on the Dashboard page.

### File: `src/hooks/useDashboardStats.ts`

Extend the `DashboardStats` interface:

```ts
export interface DashboardStats {
  objectivesCount: number;
  keyResultsCount: number;
  initiativesCount: number;
  tasksCount: number;
  krStatusDistribution: { onTrack: number; atRisk: number; behind: number; noData: number };
  initiativeDistribution: { not_started: number; in_progress: number; completed: number; blocked: number };
  taskStats: { total: number; done: number; inProgress: number; blocked: number };
}
```

Inside `useDashboardStats().queryFn`:
- Add seven additional count-only queries to the existing `Promise.all` (alongside the current `objectives`/`keyResults`/`initiatives`/`tasks`/`metricConfigs`/`metricValues` calls):
  - 4 initiative status counts (`not_started`, `in_progress`, `completed`, `blocked`), each:  
    `supabase.from("initiatives").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", <status>)`
  - 3 task status counts (`done`, `in_progress`, `blocked`), each scoped via the inner-join pattern already used for the existing `tasks` count:  
    `supabase.from("tasks").select("id, initiative:initiatives!inner(organization_id)", { count: "exact", head: true }).eq("initiative.organization_id", orgId).eq("status", <status>)`
- Fallback empty-org branch returns the new fields with all zeros.
- Build the two new objects from the `count` values:
  - `initiativeDistribution = { not_started, in_progress, completed, blocked }`
  - `taskStats = { total: tasksCount, done, inProgress, blocked }` (reuses the existing `tasks.count` for `total`)
- Return them in the final object.

No changes to `useUpcomingReviews`, `useOverdueTasks`, `useRecentUpdates`, or any of the existing logic. The query key stays the same, so caching behavior is preserved.

### File: `src/pages/Dashboard.tsx`

- Remove imports: `useInitiatives`, `useAllTasks`, `useMemo`.
- Remove `const { initiatives } = useInitiatives();` and `const { tasks } = useAllTasks();`.
- Remove both `useMemo` blocks (`initiativeDistribution`, `taskStats`).
- Replace the props passed to the charts with values from `stats`, keeping the existing fallback shapes for the loading state:

```tsx
<InitiativeStatusChart
  distribution={
    stats?.initiativeDistribution || { not_started: 0, in_progress: 0, completed: 0, blocked: 0 }
  }
/>
<TaskCompletionWidget
  {...(stats?.taskStats || { total: 0, done: 0, inProgress: 0, blocked: 0 })}
/>
```

All other JSX (header, stat cards, KR chart, secondary widgets) stays untouched.

### Result
- Dashboard payload drops from O(initiatives + tasks) rows to ~7 lightweight HEAD count requests batched in a single `Promise.all`.
- Visible output and loading skeleton placeholders are identical.
- No other files, hooks, or components are modified.

