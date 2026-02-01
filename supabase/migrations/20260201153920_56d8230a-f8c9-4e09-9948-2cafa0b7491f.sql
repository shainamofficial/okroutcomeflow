-- Fix: Remove SECURITY DEFINER characteristics from the view
-- The view already embeds authorization in its WHERE clause via get_user_org_id and has_role
-- which are SECURITY DEFINER functions, making the view itself secure

-- Drop and recreate as a simple view with embedded authorization
DROP VIEW IF EXISTS public.user_invitations_safe;

-- Create view with inline authorization (no SECURITY DEFINER needed)
-- The authorization is embedded in the WHERE clause using SECURITY DEFINER helper functions
CREATE VIEW public.user_invitations_safe AS
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

COMMENT ON VIEW public.user_invitations_safe IS 
'Secure view of user_invitations that excludes sensitive token data. Authorization is embedded in the view using SECURITY DEFINER helper functions (get_user_org_id, has_role, is_platform_admin) which restricts access to same-organization admins and managers only.';