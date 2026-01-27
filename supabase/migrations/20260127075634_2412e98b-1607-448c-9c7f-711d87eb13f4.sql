-- Create task status enum
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'blocked', 'done');

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_user_id UUID REFERENCES public.users_profile(id),
  assignee_team_id UUID REFERENCES public.teams(id),
  status task_status NOT NULL DEFAULT 'todo',
  start_date DATE,
  due_date DATE,
  created_by UUID REFERENCES public.users_profile(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraint: assignee_user_id and assignee_team_id cannot both be set
  CONSTRAINT check_single_assignee CHECK (
    NOT (assignee_user_id IS NOT NULL AND assignee_team_id IS NOT NULL)
  ),
  
  -- Constraint: due_date must be >= start_date if both exist
  CONSTRAINT check_dates CHECK (
    start_date IS NULL OR due_date IS NULL OR due_date >= start_date
  )
);

-- Create function to check if user can manage tasks for an initiative
CREATE OR REPLACE FUNCTION public.can_manage_task(_user_id UUID, _task_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    has_role(_user_id, 'admin') OR 
    has_role(_user_id, 'manager') OR
    -- Initiative owner can manage tasks
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.initiatives i ON i.id = t.initiative_id
      WHERE t.id = _task_id 
      AND i.owner_id = _user_id
      AND i.organization_id = get_user_org_id(_user_id)
    ) OR
    -- Task assignee (contributor) can edit their task
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.initiatives i ON i.id = t.initiative_id
      WHERE t.id = _task_id 
      AND t.assignee_user_id = _user_id
      AND i.organization_id = get_user_org_id(_user_id)
    )
$$;

-- Create function to get org id from task
CREATE OR REPLACE FUNCTION public.get_org_id_from_task(_task_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.organization_id
  FROM public.tasks t
  JOIN public.initiatives i ON i.id = t.initiative_id
  WHERE t.id = _task_id
$$;

-- Create trigger function to validate assignee belongs to same organization
CREATE OR REPLACE FUNCTION public.check_task_assignee_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  initiative_org UUID;
  assignee_org UUID;
BEGIN
  -- Get initiative's organization
  SELECT organization_id INTO initiative_org 
  FROM public.initiatives 
  WHERE id = NEW.initiative_id;
  
  -- Check user assignee org if set
  IF NEW.assignee_user_id IS NOT NULL THEN
    SELECT organization_id INTO assignee_org 
    FROM public.users_profile 
    WHERE id = NEW.assignee_user_id;
    
    IF assignee_org != initiative_org THEN
      RAISE EXCEPTION 'Assignee user must belong to the same organization as the initiative';
    END IF;
  END IF;
  
  -- Check team assignee org if set
  IF NEW.assignee_team_id IS NOT NULL THEN
    SELECT organization_id INTO assignee_org 
    FROM public.teams 
    WHERE id = NEW.assignee_team_id;
    
    IF assignee_org != initiative_org THEN
      RAISE EXCEPTION 'Assignee team must belong to the same organization as the initiative';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER check_task_assignee_org_trigger
BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.check_task_assignee_org();

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- SELECT: Users can view tasks in their organization
CREATE POLICY "Users can view org tasks"
ON public.tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = tasks.initiative_id
    AND i.organization_id = get_user_org_id(auth.uid())
  )
);

-- INSERT: Admins, managers, and initiative owners can create tasks
CREATE POLICY "Admins managers and initiative owners can create tasks"
ON public.tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = tasks.initiative_id
    AND i.organization_id = get_user_org_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin') OR 
      has_role(auth.uid(), 'manager') OR
      i.owner_id = auth.uid()
    )
  )
);

-- UPDATE: Admins, managers, initiative owners, and task assignees can update
CREATE POLICY "Authorized users can update tasks"
ON public.tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = tasks.initiative_id
    AND i.organization_id = get_user_org_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin') OR 
      has_role(auth.uid(), 'manager') OR
      i.owner_id = auth.uid() OR
      tasks.assignee_user_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = tasks.initiative_id
    AND i.organization_id = get_user_org_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin') OR 
      has_role(auth.uid(), 'manager') OR
      i.owner_id = auth.uid() OR
      tasks.assignee_user_id = auth.uid()
    )
  )
);

-- DELETE: Admins, managers, and initiative owners can delete tasks
CREATE POLICY "Admins managers and initiative owners can delete tasks"
ON public.tasks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = tasks.initiative_id
    AND i.organization_id = get_user_org_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin') OR 
      has_role(auth.uid(), 'manager') OR
      i.owner_id = auth.uid()
    )
  )
);