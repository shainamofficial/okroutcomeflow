# OKRoutcomeFlow — Implementation Plan

> Master roadmap combining the codebase assessment (2026-07-14), the Supabase → owned-backend
> migration, and the performance + mobile initiative. Update checkboxes as work lands.
> Each phase should merge to `main` green: lint + typecheck + tests + build all passing.

## Goals

1. **Own the backend** — replace Supabase (hosted BaaS) with a TypeScript API server we control,
   keeping Postgres as the database.
2. **Super fast** — < 200 KB gzipped initial JS, LCP < 2 s on simulated 4G, INP < 200 ms,
   single-round-trip page loads.
3. **Mobile-first for core flows** — a contributor on a phone can check tasks, update statuses,
   and log metric check-ins flawlessly.
4. **Hardened** — no known security holes, strict TypeScript, CI gates on every push.

## Current state (baseline, 2026-07-14)

- Vite + React 18 + TS SPA, ~30K LOC, 219 source files, 28 pages, no code splitting (1.73 MB bundle / 473 KB gz)
- Supabase: 102 client-side DB call sites in 47 files, 13 auth call sites, 2 storage buckets,
  1 edge function, 33 tables (all with RLS), 22 SECURITY DEFINER functions, 37 UUID-named migrations
- TypeScript strict mode OFF; build does not type-check; no CI; 2 test files (17 tests)
- Mobile: only 42/180 components use responsive breakpoints; 3 use `useIsMobile`; no virtualization
- Known vulnerability: share-link email check wildcard bypass (edge function `ilike`)

## Target architecture

```
apps/
  web/        Vite + React SPA (existing frontend, moved)
  api/        Hono + tRPC server, Drizzle ORM, Better Auth
packages/
  shared/     zod schemas, permission rules, shared types
```

- **API:** Hono + tRPC (pending final confirmation — REST+OpenAPI is the alternative; tRPC chosen
  for end-to-end types and direct TanStack Query integration)
- **ORM:** Drizzle (introspected from existing Postgres schema)
- **Auth:** Better Auth + organizations plugin (orgs, roles, invitations, Google OAuth)
- **Storage:** Cloudflare R2 (S3-compatible)
- **DB end-state:** Neon / Railway / VPS Postgres (decided in Phase 6; connection-string swap)
- **Frontend hosting:** CDN edge (Cloudflare Pages or Vercel)

---

## Phase 0 — Security + CI foundation *(in progress)*

Immediate hardening; everything else builds on the CI gate.

- [x] Fix share-link wildcard bypass: escape `%`/`_` before `ilike` in
      `supabase/functions/get-shared-initiative/index.ts` (+ input type validation).
      **Deploy note:** requires `supabase functions deploy get-shared-initiative`. ⚠️ NOT YET DEPLOYED
- [x] `typecheck` script (`tsc -b`); build becomes `tsc -b && vite build`
- [x] Lint green: fix `require()` import in tailwind.config.ts, empty interfaces;
      temporarily downgrade `@typescript-eslint/no-explicit-any` to `warn`
      (restored to `error` in Phase 5)
- [x] GitHub Actions CI: lint + typecheck + test + build on push/PR
- [x] `npm audit fix` (19 → 2 vulns; remaining 2 are the vite/esbuild dev-server chain,
      needs Vite major bump — deferred); `jsdom` bumped to v29; browserslist DB updated
- [ ] Push `main` to GitHub

**Done when:** CI runs green on GitHub; the wildcard bypass is fixed in code.

## Phase 1 — Frontend performance quick wins *(no backend dependency)*

- [x] Route-based code splitting: `React.lazy` + `Suspense` for all 28 pages;
      collapse repeated `<ProtectedRoute><AppLayout>` into layout routes
      → initial bundle 1728 KB → 666 KB (473 → 197 KB gz)
- [x] Async chunks for recharts (98 KB gz own chunk) and framer-motion (in LandingPage chunk)
- [x] React Query defaults: `staleTime: 60_000`, `placeholderData: keepPreviousData`, `retry: 1`
- [ ] Optimistic updates: task status changes, metric check-ins
- [ ] Virtualize long lists (`@tanstack/react-virtual`): TableView, ActivityLog, timeline rows
- [ ] Memoize timeline hot path (`TimelineRow`, `TimelineBar`, `TimelineChart`)
- [x] `<link rel="preconnect">` to Supabase origin in index.html
- [ ] Pagination/infinite queries for activity log + table view (bounded fetches)
- [ ] Collapse dashboard's 4 round trips into 1 Postgres RPC (interim until Phase 4 API endpoint)

**Budgets (enforced from here on):** initial JS < 200 KB gz; route chunks < 100 KB gz each.
**Done when:** `npm run build` shows split chunks within budget; dashboard loads with 1 data round trip.

## Phase 2 — Monorepo + backend skeleton

- [ ] Restructure to `apps/web`, `apps/api`, `packages/shared` (npm workspaces); CI updated
- [ ] Scaffold Hono + tRPC server; health endpoint; error handling + request logging
- [ ] Connect to the **existing Supabase Postgres** via connection string (server-side, pooled)
- [ ] Drizzle introspection → `packages/shared` schema; verify against
      `src/integrations/supabase/types.ts`
- [ ] First read procedure (e.g. `objectives.list`) consumed by one frontend hook behind a flag
- [ ] Generate a consolidated schema dump (`supabase db dump`) committed as
      `docs/schema-baseline.sql` (fixes unauditable-migrations issue)

**Done when:** web app runs with one hook served by the API and the rest still on Supabase.

## Phase 3 — Auth cutover *(highest risk — tests first)*

- [ ] Write tests for all route guards + permission logic BEFORE changes
- [ ] Port the 22 SECURITY DEFINER functions' logic into `packages/shared/permissions.ts`
      with unit tests (roles × actions matrix)
- [ ] Better Auth setup: email/password, Google OAuth, organizations plugin
      (orgs, memberships, roles, invitations)
- [ ] Migrate users: export `auth.users` bcrypt hashes → Better Auth import (passwords preserved)
- [ ] Rebuild flows: signup, login, forgot/reset password, invite accept, org switching,
      pending-approval + inactive states
- [ ] Swap `AuthContext` to API session; remove `supabase.auth.*` call sites (13)

**Done when:** all auth flows pass manual QA + automated tests; no `supabase.auth` imports remain.

## Phase 4 — Domain API port (hook by hook)

Order by risk — reads first, mutations last. Each hook: tRPC procedure(s) + authz checks
(from `permissions.ts`) + swap frontend hook + delete direct Supabase calls.

- [ ] Reads: `useDashboardStats` (single endpoint — kills round trips), `useMyItems`,
      `useGlobalSearch`, `useOrgUsers`, `useTeams` (read), `useReviews` (read)
- [ ] OKR core: `useOKRs`, `useKRMetrics`, `useInitiatives`, `useTaskDependencies`
- [ ] Mutations: `useTasks`, `useUpdates` (+ mentions/reactions), `useTeams` (write),
      `useCustomFields`, `useAutomations`, `useNotifications` + preferences,
      `useInvitations`, `useTaskWatchers`, platform hooks
- [ ] Server-side pagination for every list endpoint
- [ ] Cache headers on read endpoints where applicable

**Done when:** zero `supabase.from(` / `supabase.rpc(` call sites in `apps/web`.

## Phase 5 — Storage, share links, strict mode

- [ ] File attachments + org logos → R2 behind API (signed URLs); migrate existing objects
- [ ] Shared-initiative flow → API route with **email OTP verification** and share-link
      `expires_at`; delete the edge function
- [ ] TypeScript strict campaign: `strictNullChecks` → fix → full `strict`;
      restore `no-explicit-any: error`; re-enable `noUnusedLocals`/`no-unused-vars`
- [ ] Test coverage for money paths: `kr-hierarchy.ts`, automations engine, permissions matrix

## Phase 6 — Decommission Supabase

- [ ] Choose Postgres home (Neon / Railway / VPS); `pg_dump` → restore; swap connection string
- [ ] Drop or archive RLS policies (API is now the only client); document decision
- [ ] Deploy: API (Railway/Fly/VPS) + web (Cloudflare Pages/Vercel) with Brotli + immutable caching
- [ ] Rotate any residual keys; cancel Supabase project after a 2-week parallel-safety window

## Phase 7 — Mobile UX redesign *(parallel design track; can start any time after Phase 1)*

- [ ] Bottom tab bar on mobile (Dashboard, My Items, OKRs, Initiatives); sidebar stays on desktop
- [ ] Drawers (`vaul`, already a dependency) replace centered dialogs for detail views/forms on mobile
- [ ] TableView → card list layout on small screens
- [ ] Timeline/Gantt → agenda-list mode on mobile
- [ ] Flawless top-3 contributor flows: view my tasks, update task status, log metric check-in
- [ ] Form hygiene: `inputmode`/`type` attrs, ≥16 px input font, ≥44 px touch targets
- [ ] Page-by-page responsive audit of the remaining 138 components without breakpoints

## Phase 8 — PWA + polish

- [ ] `vite-plugin-pwa`: manifest, icons, offline app shell, cached last-known query data
- [ ] Web Push wired to the existing notifications system
- [ ] Lighthouse CI in the pipeline with budgets (LCP < 2 s @ 4G, JS < 200 KB gz, INP < 200 ms)
- [ ] Error monitoring (Sentry or similar) replacing bare `console.error`
- [ ] Consider replacing recharts with inline SVG sparklines on mobile dashboard

---

## Decision log

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-14 | Migrate off Supabase to an owned backend | User goal: own a real backend (control/learning/portfolio) |
| 2026-07-14 | Keep Postgres; strangler-pattern migration against the same DB | Zero-downtime, hook-by-hook porting |
| 2026-07-14 | tRPC over REST (provisional) | End-to-end types; 26 hooks map 1:1 to procedures; TanStack Query integration. Revisit before Phase 2 if API needs external consumers |
| 2026-07-14 | `no-explicit-any` temporarily `warn` | 37 pre-existing violations; restored in Phase 5 strict campaign |

## Risks

- **Phase 3 (auth) is where migrations die** — invitation flows, org switching, approval states.
  Mitigation: tests before changes; keep Supabase auth working in parallel until full QA passes.
- **Schema drift during migration** — Drizzle schema vs live DB. Mitigation: introspection check in CI.
- **Solo-maintainer bandwidth** — phases are independently shippable; pausing between phases is safe.
