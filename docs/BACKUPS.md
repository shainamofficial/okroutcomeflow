# Database backups

A daily GitHub Action (`.github/workflows/db-backup.yml`) runs `pg_dump` on the
`public` schema, gzips it, and uploads it to R2 under `backups/`, keeping the 30
most recent. This is your **own**, portable safety net — independent of
Supabase's built-in backups (and of the Supabase plan).

## One-time setup — repo secrets

GitHub → repo **Settings → Secrets and variables → Actions → New repository
secret**. Add:

| Secret | Value |
|--------|-------|
| `BACKUP_DATABASE_URL` | A **direct** or **session-pooler** Postgres URL (port **5432**) with `?sslmode=require`. **Not** the transaction pooler (6543) — `pg_dump` can't use it. |
| `R2_ACCOUNT_ID` | same as the API |
| `R2_ACCESS_KEY_ID` | same as the API |
| `R2_SECRET_ACCESS_KEY` | same as the API |
| `R2_BUCKET` | `okroutcomeflow-uploads` (backups live under the `backups/` prefix) |

### Getting `BACKUP_DATABASE_URL`
Supabase → **Project Settings → Database → Connection string** → pick **Session
pooler** (or **Direct connection**), port **5432**, and append `?sslmode=require`
if it isn't already there. The transaction pooler (6543) that the app uses will
**not** work with `pg_dump`.

## Run / verify
- It runs automatically at **03:00 UTC** daily.
- Trigger it manually anytime: **Actions → DB Backup → Run workflow**.
- Confirm objects appear under `backups/` in the R2 bucket.

## Restore
Download a dump and load it into a target Postgres (a fresh Supabase project, a
local DB, etc.):

```bash
# fetch (aws cli configured with the R2 creds + --endpoint-url), then:
gunzip -c okroutcomeflow-YYYY-MM-DD-HHMM.sql.gz | psql "$TARGET_DATABASE_URL"
```

Notes:
- The dump is the **`public` schema** — all app tables, the `ba_*` auth tables,
  functions, and triggers. Supabase-managed schemas (`auth`, `storage`, etc.)
  are not included because the app doesn't use them.
- A fresh target may need the `pgcrypto` extension first
  (`CREATE EXTENSION IF NOT EXISTS pgcrypto;`) since some functions use it.
- This complements — doesn't replace — Supabase's backups. Keep both.
