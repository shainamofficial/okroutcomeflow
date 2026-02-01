-- Fix: Add RLS policies to user_invitations_safe view
-- This ensures the view respects organization boundaries

-- Enable RLS on the view (required for views)
ALTER VIEW public.user_invitations_safe SET (security_invoker = on);

-- Note: Views with security_invoker respect the RLS of the underlying table
-- Since user_invitations has "No direct select access" policy, we need to 
-- recreate the view with SECURITY DEFINER to allow controlled access

-- Drop and recreate the view with proper security
DROP VIEW IF EXISTS public.user_invitations_safe;

-- Create a secure view that only exposes non-sensitive fields
-- and will have RLS applied via a security barrier
CREATE VIEW public.user_invitations_safe 
WITH (security_barrier = true) AS
SELECT 
    ui.id,
    ui.organization_id,
    ui.email,
    ui.role,
    ui.status,
    ui.expires_at,
    ui.created_at
FROM public.user_invitations ui
WHERE ui.organization_id = public.get_user_org_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'manager')
    OR public.is_platform_admin(auth.uid())
  );

-- Grant necessary permissions
GRANT SELECT ON public.user_invitations_safe TO authenticated;

-- Add comment explaining the view's purpose
COMMENT ON VIEW public.user_invitations_safe IS 
'Secure view of user_invitations that excludes sensitive token data and enforces organization-scoped access for admins and managers only.';