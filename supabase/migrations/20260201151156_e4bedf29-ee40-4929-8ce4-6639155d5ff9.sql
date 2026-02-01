-- Add color column to initiatives table
ALTER TABLE public.initiatives ADD COLUMN color text;

-- Add color column to tasks table
ALTER TABLE public.tasks ADD COLUMN color text;