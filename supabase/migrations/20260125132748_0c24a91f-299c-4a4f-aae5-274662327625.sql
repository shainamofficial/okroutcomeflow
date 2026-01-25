-- Create enums for user status and roles
CREATE TYPE public.user_status AS ENUM ('pending', 'active', 'inactive');
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'contributor', 'viewer');

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'New Organization',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create organization_domains table
CREATE TABLE public.organization_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT domain_lowercase CHECK (domain = lower(trim(domain))),
  CONSTRAINT domain_unique UNIQUE (domain)
);

CREATE INDEX idx_org_domains_org_id ON public.organization_domains(organization_id);

-- Create users_profile table (role stored separately for security)
CREATE TABLE public.users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  status public.user_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT email_lowercase CHECK (email = lower(trim(email))),
  CONSTRAINT email_unique UNIQUE (email)
);

CREATE INDEX idx_users_profile_org_id ON public.users_profile(organization_id);
CREATE INDEX idx_users_profile_status ON public.users_profile(status);

-- Create user_roles table (security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Security definer function to get user's organization_id
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.users_profile
  WHERE id = _user_id
$$;

-- RLS Policies for organizations
CREATE POLICY "Users can view their own organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (id = public.get_user_org_id(auth.uid()));

-- RLS Policies for organization_domains
CREATE POLICY "Users can view their organization domains"
ON public.organization_domains
FOR SELECT
TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()));

-- RLS Policies for users_profile
CREATE POLICY "Users can view their own profile"
ON public.users_profile
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.users_profile
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Auto-provisioning function triggered on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
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
  
  -- Check if domain exists in organization_domains
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
    
    -- Create organization domain with verified = true
    INSERT INTO public.organization_domains (organization_id, domain, verified)
    VALUES (new_org_id, email_domain, true);
    
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

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();