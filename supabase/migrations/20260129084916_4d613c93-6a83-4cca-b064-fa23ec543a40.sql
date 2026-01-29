-- Create platform_admins table
CREATE TABLE public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_admins_email_unique UNIQUE (email),
  CONSTRAINT platform_admins_email_lowercase CHECK (email = lower(email))
);

-- Enable RLS
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admins pa
    JOIN auth.users au ON lower(au.email) = pa.email
    WHERE au.id = _user_id
  )
$$;

-- Create function to count platform admins (for last-admin protection)
CREATE OR REPLACE FUNCTION public.count_platform_admins()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.platform_admins
$$;

-- RLS Policies for platform_admins table

-- SELECT: Only platform admins can view the list
CREATE POLICY "Platform admins can view platform_admins"
ON public.platform_admins
FOR SELECT
USING (is_platform_admin(auth.uid()));

-- INSERT: Only platform admins can add new platform admins
CREATE POLICY "Platform admins can add platform_admins"
ON public.platform_admins
FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()));

-- DELETE: Only platform admins can remove (last-admin check done in app layer)
CREATE POLICY "Platform admins can remove platform_admins"
ON public.platform_admins
FOR DELETE
USING (is_platform_admin(auth.uid()));

-- No UPDATE policy - platform admin emails cannot be changed

-- Seed initial platform admin
INSERT INTO public.platform_admins (email)
VALUES ('shainam.iit@gmail.com')
ON CONFLICT (email) DO NOTHING;