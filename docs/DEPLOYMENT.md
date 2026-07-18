# Deployment

Production hosting for OKRoutcomeFlow. Everything runs on your own stack.

| Piece | Host | Production URL |
|-------|------|----------------|
| Web (Vite SPA) | Cloudflare Pages | `https://app.okroutcomeflow.com` |
| API (Hono/Node) | Railway | `https://api.okroutcomeflow.com` |
| Database (Postgres) | Supabase (DB only) | via `DATABASE_URL` |
| File storage | Cloudflare R2 | (private, presigned) |
| Email | Resend | `send.okroutcomeflow.com` |

The repo already contains the deploy config: `railway.json` (API) and
`apps/web/public/_redirects` (SPA routing). The steps below are the one-time
account-side setup.

---

## 1. API → Railway

1. **Create the service**: railway.app → New Project → *Deploy from GitHub repo* →
   pick this repo. Railway reads `railway.json` at the repo root:
   - Builder: Nixpacks (auto `npm ci` at the root, installs all workspaces).
   - Node version: pinned to 22 via `.nvmrc` (Nixpacks reads it). Do **not**
     rely on the Nixpacks default, which is Node 18 and too old for this stack.
   - Start: `npm run start -w apps/api` (runs `tsx src/index.ts`; env comes from
     Railway's injected variables — no `.env` file in prod).
   - Health check: `GET /health`.
   - **Leave the service Root Directory as `/`** (the monorepo root) — the start
     command targets the `apps/api` workspace.
2. **Set environment variables** (Railway → service → Variables). Copy the values
   from your local `apps/api/.env`, with the URLs changed for production:

   | Variable | Production value |
   |----------|------------------|
   | `DATABASE_URL` | (same Supabase pooled string, port 6543) |
   | `BETTER_AUTH_SECRET` | (same as local, or a fresh 32-byte secret) |
   | `BETTER_AUTH_URL` | `https://api.okroutcomeflow.com` |
   | `CORS_ORIGINS` | `https://app.okroutcomeflow.com` |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | (same) |
   | `RESEND_API_KEY` | (same) |
   | `EMAIL_FROM` | `OutcomeFlow <noreply@send.okroutcomeflow.com>` |
   | `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | (same) |

   - **Do NOT set `PORT`** — Railway injects it and the app reads it.
   - `SUPABASE_URL` / `SUPABASE_ANON_KEY` are **optional** now (only the retired
     Supabase-token fallback used them); safe to omit.
3. **Custom domain**: Railway → service → Settings → Networking → Custom Domain →
   add `api.okroutcomeflow.com`. Railway shows a CNAME target
   (`…up.railway.app`).
4. **DNS**: Cloudflare → `okroutcomeflow.com` → DNS → add a `CNAME` record:
   `api` → the Railway target. Set it to **DNS only (grey cloud)** — proxying
   can interfere with Railway's TLS.
5. Deploy. When it's green, `https://api.okroutcomeflow.com/health` should return
   `{"status":"ok",...}`.

---

## 2. Web → Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** →
   pick this repo.
2. **Build settings**:
   - Framework preset: **None** (it's a monorepo).
   - Build command: `npm run build -w apps/web`
   - Build output directory: `apps/web/dist`
   - Root directory: `/` (leave default)
3. **Environment variables** (Build & deploy → Variables):
   - `VITE_API_URL` = `https://api.okroutcomeflow.com`  ← baked in at build time
   - `NODE_VERSION` = `22`
4. Deploy. Then **Custom domains → Set up a custom domain → `app.okroutcomeflow.com`**
   (Cloudflare wires the DNS automatically since the zone is in the same account).
5. SPA routing is handled by `apps/web/public/_redirects` (already in the repo).

---

## 3. Google OAuth (production redirect)

Google Cloud Console → your OAuth client → **Authorized redirect URIs** → add:

```
https://api.okroutcomeflow.com/api/auth/callback/google
```

Keep the existing `http://localhost:8787/api/auth/callback/google` for local dev.
(Better Auth's Google callback lives on the **API** origin, not the web app.)

---

## 4. Post-deploy checklist

- [ ] `https://api.okroutcomeflow.com/health` → `{"status":"ok"}`
- [ ] Open `https://app.okroutcomeflow.com` → login screen renders
- [ ] **Sign in with Google** → lands on the dashboard (this exercises the
      cross-subdomain session cookie: `app.` calls `api.`, same registrable
      domain, so the Secure+Lax cookie is sent)
- [ ] Email/password sign-up + login works
- [ ] Create an objective / KR / task; upload a file attachment (R2)
- [ ] Forgot password → reset email arrives (Resend, real domain)
- [ ] Open a shared-initiative link in an incognito window

### If login doesn't persist (cookie not sent)
`app.` → `api.` is same-site, so the default cookie should work. If a session
doesn't stick, set Better Auth to scope the cookie to the apex in
`apps/api/src/auth/auth.ts`:

```ts
advanced: {
  crossSubDomainCookies: { enabled: true, domain: ".okroutcomeflow.com" },
  // ...keep the existing database.generateId
}
```

---

## Redeploys

Both hosts auto-deploy on push to `main` once connected. Migrations are applied
separately (via the Supabase MCP / SQL, as during the build-out) — they are not
run automatically on deploy.
