
-- Add token_hash column for storing hashed tokens
ALTER TABLE public.user_invitations 
ADD COLUMN IF NOT EXISTS token_hash text;

-- Add expires_at column with 7 day default expiration
ALTER TABLE public.user_invitations 
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT (now() + interval '7 days');
