-- Create generic_domains table
CREATE TABLE public.generic_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generic_domains ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read (to validate before adding domains)
CREATE POLICY "Authenticated users can view generic_domains"
ON public.generic_domains
FOR SELECT
TO authenticated
USING (true);

-- Only platform admins can modify
CREATE POLICY "Platform admins can manage generic_domains"
ON public.generic_domains
FOR ALL
USING (is_platform_admin(auth.uid()));

-- Seed common consumer email domains
INSERT INTO public.generic_domains (domain) VALUES
  ('gmail.com'),
  ('googlemail.com'),
  ('hotmail.com'),
  ('outlook.com'),
  ('live.com'),
  ('msn.com'),
  ('yahoo.com'),
  ('yahoo.co.uk'),
  ('ymail.com'),
  ('aol.com'),
  ('icloud.com'),
  ('me.com'),
  ('mac.com'),
  ('protonmail.com'),
  ('proton.me'),
  ('zoho.com'),
  ('mail.com'),
  ('gmx.com'),
  ('gmx.net'),
  ('fastmail.com');

-- Create helper function to check if a domain is generic
CREATE OR REPLACE FUNCTION public.is_generic_domain(_domain TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.generic_domains
    WHERE domain = lower(trim(_domain))
  )
$$;

-- Update handle_new_user() to skip domain registration for generic emails
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