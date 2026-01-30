
-- Update hash_invitation_token trigger function to NOT clear the token
-- The token is needed for admins to share the invitation link
-- It will only be cleared when the invitation is accepted
CREATE OR REPLACE FUNCTION public.hash_invitation_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  -- Hash the token on insert using extensions schema
  -- Keep the plaintext token for admins to share the link
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

-- For accepted invitations, clear token_hash as well (already cleared token in accept_invitation)
UPDATE public.user_invitations 
SET token_hash = NULL
WHERE status = 'accepted';
