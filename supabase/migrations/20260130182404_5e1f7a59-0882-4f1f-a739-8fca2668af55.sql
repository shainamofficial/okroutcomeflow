-- Create a secure view that excludes the sensitive token field
-- This view will be used by admins/managers to see invitation data without exposing tokens
CREATE VIEW public.user_invitations_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  organization_id,
  email,
  role,
  status,
  expires_at,
  created_at
  -- Intentionally excludes: token, token_hash
FROM public.user_invitations;

-- Grant access to the view
GRANT SELECT ON public.user_invitations_safe TO authenticated;

-- Update the SELECT policy on user_invitations to deny direct access
-- This forces users to use the safe view instead
DROP POLICY IF EXISTS "Admins and managers can view org invitations" ON public.user_invitations;

-- Create a new restrictive SELECT policy that only allows access via the accept_invitation RPC
-- Direct SELECT access is denied to prevent token exposure
CREATE POLICY "No direct select access to user_invitations"
ON public.user_invitations
FOR SELECT
USING (false);

-- Note: The INSERT and UPDATE policies remain unchanged as they don't expose the token
-- The accept_invitation RPC function uses SECURITY DEFINER and handles token validation server-side