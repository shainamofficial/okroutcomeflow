
-- Update get_invitation_by_token to use token hashing and check expiration
-- Using PL/pgSQL to properly access pgcrypto functions
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token text)
RETURNS TABLE(id uuid, organization_id uuid, email text, role app_role, status invitation_status)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  token_hash_value TEXT;
BEGIN
  token_hash_value := encode(extensions.digest(_token::bytea, 'sha256'::text), 'hex');
  
  RETURN QUERY
  SELECT ui.id, ui.organization_id, ui.email, ui.role, ui.status
  FROM public.user_invitations ui
  WHERE ui.token_hash = token_hash_value
    AND (ui.expires_at IS NULL OR ui.expires_at > now());
END;
$$;

-- Update accept_invitation to check expiration and use hashed token
CREATE OR REPLACE FUNCTION public.accept_invitation(_user_id uuid, _invitation_token text, _name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  inv RECORD;
  user_email TEXT;
  token_hash_value TEXT;
BEGIN
  -- Validate user_id is not null
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  -- Calculate token hash using extensions schema
  token_hash_value := encode(extensions.digest(_invitation_token::bytea, 'sha256'::text), 'hex');

  -- Get the invitation by token hash
  SELECT ui.id, ui.organization_id, ui.email, ui.role, ui.status, ui.expires_at 
  INTO inv
  FROM public.user_invitations ui
  WHERE ui.token_hash = token_hash_value;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invitation token';
  END IF;
  
  -- Check expiration
  IF inv.expires_at IS NOT NULL AND inv.expires_at < now() THEN
    RAISE EXCEPTION 'This invitation has expired';
  END IF;
  
  IF inv.status = 'revoked' THEN
    RAISE EXCEPTION 'This invitation has been revoked';
  END IF;
  
  IF inv.status = 'accepted' THEN
    RAISE EXCEPTION 'This invitation has already been used';
  END IF;
  
  -- Get the user's email from auth.users
  SELECT au.email INTO user_email
  FROM auth.users au
  WHERE au.id = _user_id;
  
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
  WHERE public.users_profile.id = _user_id;
  
  -- Delete existing roles for this user
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  
  -- Insert the role from the invitation
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, inv.role);
  
  -- Mark the invitation as accepted and clear the token for security
  UPDATE public.user_invitations
  SET status = 'accepted',
      token = NULL,
      token_hash = NULL
  WHERE public.user_invitations.id = inv.id;
  
  RETURN true;
END;
$$;

-- Update hash_invitation_token trigger function to use extensions schema
CREATE OR REPLACE FUNCTION public.hash_invitation_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  -- Hash the token on insert using extensions schema
  IF NEW.token IS NOT NULL AND NEW.token != '' THEN
    NEW.token_hash := encode(extensions.digest(NEW.token::bytea, 'sha256'::text), 'hex');
  END IF;
  
  -- Set default expiration if not provided (7 days)
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := now() + interval '7 days';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS hash_invitation_token_trigger ON public.user_invitations;
CREATE TRIGGER hash_invitation_token_trigger
  BEFORE INSERT ON public.user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.hash_invitation_token();

-- Make token column nullable
ALTER TABLE public.user_invitations ALTER COLUMN token DROP NOT NULL;

-- Re-hash existing tokens with the correct function
UPDATE public.user_invitations 
SET token_hash = encode(extensions.digest(token::bytea, 'sha256'::text), 'hex')
WHERE token IS NOT NULL AND token != '';

-- Now clear plaintext tokens for existing invitations (they're already hashed)
UPDATE public.user_invitations 
SET token = NULL
WHERE token_hash IS NOT NULL AND token IS NOT NULL;
