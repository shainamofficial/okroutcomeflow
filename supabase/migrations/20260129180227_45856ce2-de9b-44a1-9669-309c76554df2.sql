-- Fix the handle_new_user() function to properly handle all signup scenarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  email_domain TEXT;
  existing_org_id UUID;
  new_org_id UUID;
  user_name TEXT;
BEGIN
  -- Get email and convert to lowercase
  user_email := lower(trim(NEW.email));
  
  -- Extract domain from email
  email_domain := lower(trim(split_part(user_email, '@', 2)));
  
  -- Validate email has a domain
  IF email_domain IS NULL OR email_domain = '' THEN
    RAISE EXCEPTION 'Invalid email address';
  END IF;
  
  -- Get user name from metadata or default to empty string
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  
  -- Check if domain exists in organization_domains (only for non-generic domains)
  SELECT organization_id INTO existing_org_id
  FROM public.organization_domains
  WHERE domain = email_domain
  LIMIT 1;
  
  IF existing_org_id IS NOT NULL THEN
    -- Domain exists: create profile as contributor with pending status
    INSERT INTO public.users_profile (id, organization_id, email, name, status)
    VALUES (NEW.id, existing_org_id, user_email, user_name, 'pending')
    ON CONFLICT (id) DO NOTHING;
    
    -- Add contributor role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'contributor')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Domain does not exist: create new organization
    INSERT INTO public.organizations (name)
    VALUES ('New Organization')
    RETURNING id INTO new_org_id;
    
    -- Only create organization domain if NOT a generic domain
    IF NOT is_generic_domain(email_domain) THEN
      INSERT INTO public.organization_domains (organization_id, domain, verified)
      VALUES (new_org_id, email_domain, true);
    END IF;
    
    -- Create profile as admin with active status
    INSERT INTO public.users_profile (id, organization_id, email, name, status)
    VALUES (NEW.id, new_org_id, user_email, user_name, 'active')
    ON CONFLICT (id) DO NOTHING;
    
    -- Add admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix existing users with NULL organization_id
-- Fix authentickteam@gmail.com
DO $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM public.users_profile WHERE email = 'authentickteam@gmail.com';
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.organizations (name) VALUES ('New Organization') RETURNING id INTO v_org_id;
    UPDATE public.users_profile SET organization_id = v_org_id, status = 'active' WHERE id = v_user_id;
    DELETE FROM public.user_roles WHERE user_id = v_user_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin');
  END IF;
END $$;

-- Fix jozzire.ps4@gmail.com
DO $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM public.users_profile WHERE email = 'jozzire.ps4@gmail.com' AND organization_id IS NULL;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.organizations (name) VALUES ('New Organization') RETURNING id INTO v_org_id;
    UPDATE public.users_profile SET organization_id = v_org_id, status = 'active' WHERE id = v_user_id;
    DELETE FROM public.user_roles WHERE user_id = v_user_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin');
  END IF;
END $$;

-- Fix shainam.iit@gmail.com
DO $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM public.users_profile WHERE email = 'shainam.iit@gmail.com' AND organization_id IS NULL;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.organizations (name) VALUES ('New Organization') RETURNING id INTO v_org_id;
    UPDATE public.users_profile SET organization_id = v_org_id, status = 'active' WHERE id = v_user_id;
    DELETE FROM public.user_roles WHERE user_id = v_user_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin');
  END IF;
END $$;