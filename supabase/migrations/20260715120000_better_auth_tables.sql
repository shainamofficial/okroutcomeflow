-- Better Auth core tables. Namespaced `ba_*` to avoid the reserved word
-- `user` and to mark them as Better Auth's own. These hold authentication
-- identity only; domain data (profile, org, roles) stays in the existing
-- tables. Ids are UUID-shaped text so a later migration can import existing
-- users under their current Supabase auth uuid and preserve every FK.
--
-- Stood up alongside Supabase Auth during Phase 3; nothing references these
-- yet. The AuthContext cutover and user migration come in a later PR.

CREATE TABLE IF NOT EXISTS public.ba_user (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  email_verified boolean NOT NULL DEFAULT false,
  image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ba_session (
  id text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  user_id text NOT NULL REFERENCES public.ba_user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.ba_account (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  provider_id text NOT NULL,
  user_id text NOT NULL REFERENCES public.ba_user(id) ON DELETE CASCADE,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  password text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ba_verification (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ba_session_user_id ON public.ba_session(user_id);
CREATE INDEX IF NOT EXISTS idx_ba_account_user_id ON public.ba_account(user_id);
CREATE INDEX IF NOT EXISTS idx_ba_verification_identifier ON public.ba_verification(identifier);

-- Better Auth connects as the pooler's application role and manages its own
-- access; these tables are never exposed to the browser (no anon grants, no
-- RLS policies needed — the anon/authenticated roles get no privileges).
REVOKE ALL ON public.ba_user, public.ba_session, public.ba_account, public.ba_verification FROM anon, authenticated;
