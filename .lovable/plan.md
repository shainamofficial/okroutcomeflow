` tags as specified in my instructions.

<lov-plan>

## Replace Boilerplate README and Add `.env.example`

The current `README.md` is unchanged Lovable boilerplate (still contains `REPLACE_WITH_PROJECT_ID`). Replace it with a real project README and add a `.env.example` at the repo root so contributors know which Supabase keys to fill in.

### Files

**Edited:** `README.md` — full rewrite with these sections in order:

1. Title: **OKRoutcomeFlow**
2. One-paragraph positioning: lightweight OKR tool that connects strategy to the day-to-day work that moves it; for small-to-mid product/ops teams that have outgrown spreadsheets but don't want to learn Jira.
3. **What it does** — bulleted explanation of Objectives, Key Results, Initiatives, Tasks; plus a one-line summary of roles, reviews, timeline/calendar/workload/table/board views, automations, custom fields, file attachments, mentions, activity log, and notifications.
4. **Tech stack** — Vite + React + TypeScript; Tailwind + shadcn/ui + Radix; TanStack Query; Supabase (Postgres + Auth + RLS); react-router-dom; Vitest; note that it was scaffolded with Lovable.
5. **Local setup** — bash block: `git clone`, `cd`, `npm install`, `cp .env.example .env` (with note to fill in Supabase values), `npm run dev`, and `http://localhost:5173`.
6. **Environment variables** — markdown table documenting `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Followed by a blockquote warning: the anon key is safe to expose only if every Postgres table has RLS enabled and scoped policies; audit RLS before going to production.
7. **Supabase setup** — references the `supabase/` folder; shows `supabase link --project-ref <ref>` and `supabase db push`.
8. **Scripts** — markdown table for `dev`, `build`, `preview`, `lint`, `test`.
9. **Roles** — markdown table: Contributor, Manager, Admin, Platform admin, each with a brief "Can do" description.
10. **Deploy** — Vite SPA backed by Supabase; deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages, S3 + CloudFront), or use Lovable's Share → Publish.
11. **Contributing** and **License: MIT** lines at the bottom.

**New:** `.env.example` at repo root — three keys set to empty strings, preceded by a one-line comment pointing to Supabase Dashboard → Settings → API:

```
# Supabase — all client-safe (publishable) values only.
# Get these from: Supabase Dashboard → Settings → API
VITE_SUPABASE_PROJECT_ID=""
VITE_SUPABASE_URL=""
VITE_SUPABASE_PUBLISHABLE_KEY=""
```

### Out of scope
No other files. No code, dependency, or schema changes.

