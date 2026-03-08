
-- Add parent_task_id for subtasks
ALTER TABLE public.tasks ADD COLUMN parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE;

-- Create task dependencies table
CREATE TABLE public.task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  dependency_type text NOT NULL DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'waiting_on')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id)
);

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view dependencies in their org
CREATE POLICY "Users can view org task dependencies" ON public.task_dependencies
  FOR SELECT TO authenticated
  USING (
    is_platform_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.initiatives i ON i.id = t.initiative_id
      WHERE t.id = task_dependencies.task_id
      AND i.organization_id = get_user_org_id(auth.uid())
    )
  );

-- RLS: Authorized users can create dependencies
CREATE POLICY "Authorized users can create task dependencies" ON public.task_dependencies
  FOR INSERT TO authenticated
  WITH CHECK (
    is_platform_admin(auth.uid()) OR
    can_manage_task(auth.uid(), task_id)
  );

-- RLS: Authorized users can delete dependencies
CREATE POLICY "Authorized users can delete task dependencies" ON public.task_dependencies
  FOR DELETE TO authenticated
  USING (
    is_platform_admin(auth.uid()) OR
    can_manage_task(auth.uid(), task_id)
  );
