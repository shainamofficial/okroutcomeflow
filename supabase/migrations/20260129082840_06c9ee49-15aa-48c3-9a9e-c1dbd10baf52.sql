-- Create a SECURITY DEFINER function to accept invitations server-side
-- This prevents client-side manipulation of organization_id, roles, and status

CREATE OR REPLACE FUNCTION public.accept_invitation(_user_id uuid, _invitation_token text, _name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  inv_email TEXT;
  user_email TEXT;
BEGIN
  -- Get the invitation by token
  SELECT id, organization_id, email, role, status 
  INTO inv
  FROM public.user_invitations
  WHERE token = _invitation_token;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invitation token';
  END IF;
  
  IF inv.status = 'revoked' THEN
    RAISE EXCEPTION 'This invitation has been revoked';
  END IF;
  
  IF inv.status = 'accepted' THEN
    RAISE EXCEPTION 'This invitation has already been used';
  END IF;
  
  -- Get the user's email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = _user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Verify the invitation email matches the user's email (case-insensitive)
  IF lower(trim(inv.email)) != lower(trim(user_email)) THEN
    RAISE EXCEPTION 'Invitation email does not match user email';
  END IF;
  
  -- Update the user profile with the correct organization and status
  UPDATE public.users_profile
  SET 
    organization_id = inv.organization_id,
    status = 'active',
    name = COALESCE(NULLIF(trim(_name), ''), name)
  WHERE id = _user_id;
  
  -- Delete existing roles for this user
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  
  -- Insert the role from the invitation
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, inv.role);
  
  -- Mark the invitation as accepted
  UPDATE public.user_invitations
  SET status = 'accepted'
  WHERE id = inv.id;
  
  RETURN true;
END;
$$;