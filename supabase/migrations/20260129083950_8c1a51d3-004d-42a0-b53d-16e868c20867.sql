-- Drop and recreate the SELECT policy on notifications to explicitly require authentication
-- The current policy uses user_id = auth.uid() but auth.uid() returns NULL for unauthenticated users
-- which could potentially be exploited. This policy explicitly requires auth.uid() to be NOT NULL.

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());