-- Auth cutover, backend half: decouple the domain tables from Supabase's
-- auth.users and re-home new-user provisioning onto Better Auth signups.
-- Non-breaking: the Supabase auth path keeps working (its session still
-- drives RLS) until the frontend AuthContext flip in a later PR.

-- 1. Drop the FKs to auth.users. Identity now comes from Better Auth
--    (ba_user); these columns keep the same UUIDs, and the API enforces
--    referential integrity. Existing rows are unaffected.
ALTER TABLE public.users_profile DROP CONSTRAINT IF EXISTS users_profile_id_fkey;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.organization_memberships
  DROP CONSTRAINT IF EXISTS organization_memberships_user_id_fkey;

-- 2. Provisioning trigger on ba_user — a faithful port of handle_new_user
--    (the auth.users trigger), reading from Better Auth's columns instead.
--    Guarded so a migrated user (whose profile already exists) is skipped,
--    and every insert is idempotent.
CREATE OR REPLACE FUNCTION public.handle_new_betterauth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_user_id uuid;
  user_email text;
  email_domain text;
  existing_org_id uuid;
  new_org_id uuid;
  user_name text;
BEGIN
  new_user_id := NEW.id::uuid;

  -- Migrated / already-provisioned users: leave their domain rows alone.
  IF EXISTS (SELECT 1 FROM public.users_profile WHERE id = new_user_id) THEN
    RETURN NEW;
  END IF;

  user_email := lower(trim(NEW.email));
  email_domain := lower(trim(split_part(user_email, '@', 2)));
  IF email_domain IS NULL OR email_domain = '' THEN
    RAISE EXCEPTION 'Invalid email address';
  END IF;
  user_name := COALESCE(NULLIF(trim(NEW.name), ''), '');

  SELECT organization_id INTO existing_org_id
  FROM public.organization_domains
  WHERE domain = email_domain
  LIMIT 1;

  IF existing_org_id IS NOT NULL THEN
    INSERT INTO public.users_profile (id, organization_id, email, name, status)
    VALUES (new_user_id, existing_org_id, user_email, user_name, 'pending')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role, organization_id)
    VALUES (new_user_id, 'contributor', existing_org_id)
    ON CONFLICT (user_id, role, organization_id) DO NOTHING;

    INSERT INTO public.organization_memberships (user_id, organization_id, is_active)
    VALUES (new_user_id, existing_org_id, true)
    ON CONFLICT (user_id, organization_id) DO NOTHING;
  ELSE
    INSERT INTO public.organizations (name)
    VALUES ('New Organization')
    RETURNING id INTO new_org_id;

    IF NOT public.is_generic_domain(email_domain) THEN
      INSERT INTO public.organization_domains (organization_id, domain, verified)
      VALUES (new_org_id, email_domain, true);
    END IF;

    INSERT INTO public.users_profile (id, organization_id, email, name, status)
    VALUES (new_user_id, new_org_id, user_email, user_name, 'active')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role, organization_id)
    VALUES (new_user_id, 'admin', new_org_id)
    ON CONFLICT (user_id, role, organization_id) DO NOTHING;

    INSERT INTO public.organization_memberships (user_id, organization_id, is_active)
    VALUES (new_user_id, new_org_id, true)
    ON CONFLICT (user_id, organization_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_betterauth_user_created ON public.ba_user;
CREATE TRIGGER on_betterauth_user_created
  AFTER INSERT ON public.ba_user
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_betterauth_user();
