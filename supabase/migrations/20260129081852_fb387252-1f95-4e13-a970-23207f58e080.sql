-- Drop the overly permissive INSERT policy on notifications table
-- The database triggers (notify_on_mention, notify_on_task_assignment) use SECURITY DEFINER
-- which bypasses RLS, so they will still be able to create notifications

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;