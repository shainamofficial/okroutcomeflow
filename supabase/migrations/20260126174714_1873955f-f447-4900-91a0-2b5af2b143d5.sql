-- Create invitation status enum
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'revoked');

-- Create user_invitations table
CREATE TABLE public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role app_role NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status invitation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_user_invitations_organization_id ON public.user_invitations(organization_id);
CREATE INDEX idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX idx_user_invitations_token ON public.user_invitations(token);

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS: Admins and managers can view invitations for their org
CREATE POLICY "Admins and managers can view org invitations"
ON public.user_invitations FOR SELECT
USING (
  organization_id = get_user_org_id(auth.uid())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

-- RLS: Admins and managers can create invitations for their org
CREATE POLICY "Admins and managers can create invitations"
ON public.user_invitations FOR INSERT
WITH CHECK (
  organization_id = get_user_org_id(auth.uid())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

-- RLS: Admins and managers can update invitations for their org
CREATE POLICY "Admins and managers can update invitations"
ON public.user_invitations FOR UPDATE
USING (
  organization_id = get_user_org_id(auth.uid())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
)
WITH CHECK (
  organization_id = get_user_org_id(auth.uid())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

-- RLS: Allow public to read invitation by token (for signup flow)
CREATE POLICY "Anyone can read invitation by token"
ON public.user_invitations FOR SELECT
USING (true);

-- Function to get invitation by token (for unauthenticated access)
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token text)
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  email text,
  role app_role,
  status invitation_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, organization_id, email, role, status
  FROM public.user_invitations
  WHERE token = _token
$$;

-- RLS: Admins and managers can view users in their org
CREATE POLICY "Admins and managers can view org users"
ON public.users_profile FOR SELECT
USING (
  organization_id = get_user_org_id(auth.uid())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

-- RLS: Admins can update any user in their org
CREATE POLICY "Admins can update org users"
ON public.users_profile FOR UPDATE
USING (
  organization_id = get_user_org_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
)
WITH CHECK (
  organization_id = get_user_org_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- RLS: Admins can view all roles in their org
CREATE POLICY "Admins and managers can view org user roles"
ON public.user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users_profile up
    WHERE up.id = user_roles.user_id
    AND up.organization_id = get_user_org_id(auth.uid())
  )
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

-- RLS: Admins can manage roles in their org
CREATE POLICY "Admins can manage org user roles"
ON public.user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users_profile up
    WHERE up.id = user_roles.user_id
    AND up.organization_id = get_user_org_id(auth.uid())
  )
  AND has_role(auth.uid(), 'admin')
);

-- Function to count admins in an organization
CREATE OR REPLACE FUNCTION public.count_org_admins(_org_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.user_roles ur
  JOIN public.users_profile up ON up.id = ur.user_id
  WHERE up.organization_id = _org_id
  AND ur.role = 'admin'
  AND up.status = 'active'
$$;

-- Function to check if user is the last admin
CREATE OR REPLACE FUNCTION public.is_last_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    SELECT COUNT(*) = 1
    FROM public.user_roles ur
    JOIN public.users_profile up ON up.id = ur.user_id
    WHERE up.organization_id = (SELECT organization_id FROM public.users_profile WHERE id = _user_id)
    AND ur.role = 'admin'
    AND up.status = 'active'
  )
  AND has_role(_user_id, 'admin')
$$;