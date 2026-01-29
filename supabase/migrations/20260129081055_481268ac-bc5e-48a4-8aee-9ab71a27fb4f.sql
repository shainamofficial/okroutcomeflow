-- Create notification type enum
CREATE TYPE public.notification_type AS ENUM ('mention', 'review_reminder', 'task_assigned', 'task_overdue');

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  entity_type entity_type NULL,
  entity_id UUID NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- System can insert notifications (via triggers with security definer)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (user_id = auth.uid());

-- Trigger function: Create notification on mention
CREATE OR REPLACE FUNCTION public.notify_on_mention()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  update_record RECORD;
  author_name TEXT;
BEGIN
  -- Get update details
  SELECT u.*, up.name, up.email
  INTO update_record
  FROM public.updates u
  JOIN public.users_profile up ON up.id = u.user_id
  WHERE u.id = NEW.update_id;
  
  author_name := COALESCE(update_record.name, update_record.email);
  
  -- Create notification for mentioned user
  INSERT INTO public.notifications (user_id, type, entity_type, entity_id, message)
  VALUES (
    NEW.mentioned_user_id,
    'mention',
    update_record.entity_type,
    update_record.entity_id,
    author_name || ' mentioned you in a ' || update_record.entity_type || ' update'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger: Notify on mention
CREATE TRIGGER trigger_notify_on_mention
AFTER INSERT ON public.update_mentions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_mention();

-- Trigger function: Create notification on task assignment
CREATE OR REPLACE FUNCTION public.notify_on_task_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only if assignee_user_id is set or changed
  IF NEW.assignee_user_id IS NOT NULL AND 
     (OLD IS NULL OR OLD.assignee_user_id IS DISTINCT FROM NEW.assignee_user_id) THEN
    INSERT INTO public.notifications (user_id, type, entity_type, entity_id, message)
    VALUES (
      NEW.assignee_user_id,
      'task_assigned',
      'task',
      NEW.id,
      'You have been assigned to task: ' || NEW.title
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger: Notify on task assignment
CREATE TRIGGER trigger_notify_on_task_assignment
AFTER INSERT OR UPDATE OF assignee_user_id ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_task_assignment();

-- Helper function to get organization ID from user
CREATE OR REPLACE FUNCTION public.get_org_id_from_notification(_notification_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.organization_id
  FROM public.notifications n
  JOIN public.users_profile up ON up.id = n.user_id
  WHERE n.id = _notification_id
$$;