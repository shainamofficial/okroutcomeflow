# OKRoutcomeFlow

OKRoutcomeFlow is a lightweight OKR tool that connects company strategy to the day-to-day work that moves it. It is built for small-to-mid-sized product and ops teams that have outgrown spreadsheets but don't want to learn Jira.

## What it does

The app is organised around four primitives:

- **Objectives** — qualitative, inspirational statements of what the team wants to achieve this cycle.
- **Key Results** — measurable outcomes that prove an Objective is being met. Each KR has a start value, target value, deadline, and one accountable owner.
- **Initiatives** — the projects you actually run to move Key Results. Each initiative links to the KR(s) it supports.
- **Tasks** — concrete, assignable work items under each initiative, with due dates, owners, dependencies, and status.

Around those primitives the app provides role-based access, review cadences, multiple views (timeline, calendar, workload, table, board), automations, custom fields, file attachments, mentions and activity log, and configurable notifications.

## Tech stack

- **Vite + React + TypeScript** — frontend build and runtime
- **Tailwind CSS + shadcn/ui + Radix UI** — styling and accessible primitives
- **TanStack Query** — server state, caching, and optimistic updates
- **Supabase** — Postgres, Auth, and Row Level Security
- **react-router-dom** — routing
- **Vitest** — unit tests

## Local setup

```sh
git clone <YOUR_GIT_URL>
cd okroutcomeflow
npm install
cp .env.example .env   # then fill in your Supabase project values
npm run dev
```

The dev server runs at http://localhost:5173.

## Environment variables

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_PROJECT_ID` | Supabase project reference (the subdomain of your project URL). |
| `VITE_SUPABASE_URL` | Full Supabase project URL, e.g. `https://<project-id>.supabase.co`. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The Supabase anon (publishable) key shipped to the browser. |

> ⚠️ **Security**: the anon key is safe to expose **only** if every Postgres table has Row Level Security enabled and scoped policies. Audit RLS before going to production.

## Supabase setup

The `supabase/` folder contains the project configuration, SQL migrations, and edge function source. To attach a fresh Supabase project and apply the schema:

```sh
supabase link --project-ref <your-project-ref>
supabase db push
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR. |
| `npm run build` | Type-check and produce a production build in `dist/`. |
| `npm run preview` | Serve the production build locally for sanity checks. |
| `npm run lint` | Run ESLint across the project. |
| `npm run test` | Run the Vitest test suite. |

## Roles

| Role | Can do |
|---|---|
| **Contributor** | View OKRs and initiatives in their org, update assigned tasks, log KR metric values, post updates and comments. |
| **Manager** | Everything a contributor can, plus invite/deactivate users, manage teams, and create or edit OKRs and initiatives. |
| **Admin** | Full org control — organization settings, custom fields, cycles, automations, and role assignment. |
| **Platform admin** | Cross-org operator: manage organizations and platform-level users from the Platform console. |

## Deploy

OKRoutcomeFlow is a Vite single-page app backed by Supabase. To deploy, run `npm run build` and serve `dist/` from any static host — Vercel, Netlify, Cloudflare Pages, or S3 + CloudFront all work.

Make sure your hosting target's environment exposes the three `VITE_SUPABASE_*` variables at build time.

Remember to set `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY` in your hosting provider's environment variables. Without these, the production build will fail to connect to Supabase.

## Contributing

Issues and pull requests are welcome. Please run `npm run lint` and `npm run test` before opening a PR, and keep changes scoped to a single concern where possible.

## License

MIT
