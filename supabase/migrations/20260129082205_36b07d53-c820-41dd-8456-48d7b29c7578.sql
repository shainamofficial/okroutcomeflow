-- Drop the overly permissive SELECT policy that exposes all invitation records
-- The get_invitation_by_token function uses SECURITY DEFINER and bypasses RLS,
-- so it will continue to work for token-based lookups

DROP POLICY IF EXISTS "Anyone can read invitation by token" ON public.user_invitations;