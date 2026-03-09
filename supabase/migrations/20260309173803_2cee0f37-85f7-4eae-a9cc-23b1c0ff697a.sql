
-- 1. Create organization_memberships table
CREATE TABLE public.organization_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own memberships
CREATE POLICY "Users can view their own memberships"
ON public.organization_memberships
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_platform_admin(auth.uid()));

-- RLS: Only system (security definer functions) can insert/update/delete
CREATE POLICY "Platform admins can manage memberships"
ON public.organization_memberships
FOR ALL
TO authenticated
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

-- 2. Backfill organization_memberships from existing users_profile
INSERT INTO public.organization_memberships (user_id, organization_id, is_active)
SELECT id, organization_id, true
FROM public.users_profile
WHERE organization_id IS NOT NULL
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- 3. Add organization_id to user_roles
ALTER TABLE public.user_roles ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

-- Drop old unique constraint and add new one
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_org_key UNIQUE (user_id, role, organization_id);

-- 4. Backfill organization_id on user_roles from users_profile
UPDATE public.user_roles ur
SET organization_id = up.organization_id
FROM public.users_profile up
WHERE ur.user_id = up.id AND ur.organization_id IS NULL;

-- 5. Update get_user_org_id to use organization_memberships
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT organization_id
  FROM public.organization_memberships
  WHERE user_id = _user_id
    AND is_active = true
  LIMIT 1
$$;

-- 6. Update has_role to scope to active organization
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND (
        ur.organization_id IS NULL
        OR ur.organization_id = (
          SELECT om.organization_id
          FROM public.organization_memberships om
          WHERE om.user_id = _user_id AND om.is_active = true
          LIMIT 1
        )
      )
  )
$$;

-- 7. Update handle_new_user to also create membership
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_email TEXT;
  email_domain TEXT;
  existing_org_id UUID;
  new_org_id UUID;
  user_name TEXT;
BEGIN
  user_email := lower(trim(NEW.email));
  email_domain := lower(trim(split_part(user_email, '@', 2)));
  
  IF email_domain IS NULL OR email_domain = '' THEN
    RAISE EXCEPTION 'Invalid email address';
  END IF;
  
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  
  SELECT organization_id INTO existing_org_id
  FROM public.organization_domains
  WHERE domain = email_domain
  LIMIT 1;
  
  IF existing_org_id IS NOT NULL THEN
    INSERT INTO public.users_profile (id, organization_id, email, name, status)
    VALUES (NEW.id, existing_org_id, user_email, user_name, 'pending')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.user_roles (user_id, role, organization_id)
    VALUES (NEW.id, 'contributor', existing_org_id)
    ON CONFLICT (user_id, role, organization_id) DO NOTHING;
    
    INSERT INTO public.organization_memberships (user_id, organization_id, is_active)
    VALUES (NEW.id, existing_org_id, true)
    ON CONFLICT (user_id, organization_id) DO NOTHING;
  ELSE
    INSERT INTO public.organizations (name)
    VALUES ('New Organization')
    RETURNING id INTO new_org_id;
    
    IF NOT is_generic_domain(email_domain) THEN
      INSERT INTO public.organization_domains (organization_id, domain, verified)
      VALUES (new_org_id, email_domain, true);
    END IF;
    
    INSERT INTO public.users_profile (id, organization_id, email, name, status)
    VALUES (NEW.id, new_org_id, user_email, user_name, 'active')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.user_roles (user_id, role, organization_id)
    VALUES (NEW.id, 'admin', new_org_id)
    ON CONFLICT (user_id, role, organization_id) DO NOTHING;
    
    INSERT INTO public.organization_memberships (user_id, organization_id, is_active)
    VALUES (NEW.id, new_org_id, true)
    ON CONFLICT (user_id, organization_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 8. Create switch_organization RPC
CREATE OR REPLACE FUNCTION public.switch_organization(_user_id uuid, _target_org_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF _user_id IS NULL OR _target_org_id IS NULL THEN
    RAISE EXCEPTION 'User ID and target organization ID are required';
  END IF;
  
  -- Verify caller is the user themselves
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'You can only switch your own organization';
  END IF;
  
  -- Verify user has membership in target org
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE user_id = _user_id AND organization_id = _target_org_id
  ) THEN
    RAISE EXCEPTION 'You are not a member of this organization';
  END IF;
  
  -- Deactivate all memberships for this user
  UPDATE public.organization_memberships
  SET is_active = false
  WHERE user_id = _user_id;
  
  -- Activate the target membership
  UPDATE public.organization_memberships
  SET is_active = true
  WHERE user_id = _user_id AND organization_id = _target_org_id;
  
  -- Update denormalized field on users_profile
  UPDATE public.users_profile
  SET organization_id = _target_org_id
  WHERE id = _user_id;
  
  RETURN true;
END;
$function$;

-- 9. Update accept_invitation to handle existing users joining new orgs
CREATE OR REPLACE FUNCTION public.accept_invitation(_user_id uuid, _invitation_token text, _name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  inv RECORD;
  user_email TEXT;
  token_hash_value TEXT;
  existing_profile RECORD;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  token_hash_value := encode(extensions.digest(_invitation_token::bytea, 'sha256'::text), 'hex');

  SELECT ui.id, ui.organization_id, ui.email, ui.role, ui.status, ui.expires_at 
  INTO inv
  FROM public.user_invitations ui
  WHERE ui.token_hash = token_hash_value;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invitation token';
  END IF;
  
  IF inv.expires_at IS NOT NULL AND inv.expires_at < now() THEN
    RAISE EXCEPTION 'This invitation has expired';
  END IF;
  
  IF inv.status = 'revoked' THEN
    RAISE EXCEPTION 'This invitation has been revoked';
  END IF;
  
  IF inv.status = 'accepted' THEN
    RAISE EXCEPTION 'This invitation has already been used';
  END IF;
  
  SELECT au.email INTO user_email
  FROM auth.users au
  WHERE au.id = _user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  IF lower(trim(inv.email)) != lower(trim(user_email)) THEN
    RAISE EXCEPTION 'Invitation email does not match user email';
  END IF;
  
  -- Check if user already has a profile (existing user joining new org)
  SELECT * INTO existing_profile
  FROM public.users_profile
  WHERE id = _user_id;
  
  IF existing_profile IS NOT NULL AND existing_profile.organization_id IS NOT NULL THEN
    -- Existing user: create membership for the new org (don't switch active)
    INSERT INTO public.organization_memberships (user_id, organization_id, is_active)
    VALUES (_user_id, inv.organization_id, false)
    ON CONFLICT (user_id, organization_id) DO NOTHING;
    
    -- Add role for the new org
    INSERT INTO public.user_roles (user_id, role, organization_id)
    VALUES (_user_id, inv.role, inv.organization_id)
    ON CONFLICT (user_id, role, organization_id) DO NOTHING;
  ELSE
    -- New user: set up profile with this org as active
    UPDATE public.users_profile
    SET 
      organization_id = inv.organization_id,
      status = 'active',
      name = COALESCE(NULLIF(trim(_name), ''), name)
    WHERE public.users_profile.id = _user_id;
    
    -- Delete existing roles for this user (from auto-provisioning)
    DELETE FROM public.user_roles WHERE user_id = _user_id;
    
    -- Insert the role from the invitation
    INSERT INTO public.user_roles (user_id, role, organization_id)
    VALUES (_user_id, inv.role, inv.organization_id);
    
    -- Create active membership
    INSERT INTO public.organization_memberships (user_id, organization_id, is_active)
    VALUES (_user_id, inv.organization_id, true)
    ON CONFLICT (user_id, organization_id) DO UPDATE SET is_active = true;
  END IF;
  
  -- Mark the invitation as accepted
  UPDATE public.user_invitations
  SET status = 'accepted',
      token = NULL,
      token_hash = NULL
  WHERE public.user_invitations.id = inv.id;
  
  RETURN true;
END;
$function$;
