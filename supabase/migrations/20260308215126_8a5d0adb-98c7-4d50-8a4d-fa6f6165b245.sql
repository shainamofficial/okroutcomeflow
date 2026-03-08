
-- Task watchers table
CREATE TABLE public.task_watchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, user_id)
);

ALTER TABLE public.task_watchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org task watchers" ON public.task_watchers
  FOR SELECT TO authenticated
  USING (
    is_platform_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.initiatives i ON i.id = t.initiative_id
      WHERE t.id = task_watchers.task_id
      AND i.organization_id = get_user_org_id(auth.uid())
    )
  );

CREATE POLICY "Org users can watch tasks" ON public.task_watchers
  FOR INSERT TO authenticated
  WITH CHECK (
    is_platform_admin(auth.uid()) OR
    (user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.initiatives i ON i.id = t.initiative_id
      WHERE t.id = task_watchers.task_id
      AND i.organization_id = get_user_org_id(auth.uid())
    ))
  );

CREATE POLICY "Users can unwatch tasks" ON public.task_watchers
  FOR DELETE TO authenticated
  USING (
    is_platform_admin(auth.uid()) OR user_id = auth.uid()
  );

-- Managers can add watchers for others
CREATE POLICY "Managers can manage watchers" ON public.task_watchers
  FOR ALL TO authenticated
  USING (
    is_platform_admin(auth.uid()) OR
    (EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.initiatives i ON i.id = t.initiative_id
      WHERE t.id = task_watchers.task_id
      AND i.organization_id = get_user_org_id(auth.uid())
    ) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')))
  )
  WITH CHECK (
    is_platform_admin(auth.uid()) OR
    (EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.initiatives i ON i.id = t.initiative_id
      WHERE t.id = task_watchers.task_id
      AND i.organization_id = get_user_org_id(auth.uid())
    ) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')))
  );
