
-- Add recurrence_rule to tasks for recurring tasks
ALTER TABLE public.tasks ADD COLUMN recurrence_rule jsonb DEFAULT NULL;
