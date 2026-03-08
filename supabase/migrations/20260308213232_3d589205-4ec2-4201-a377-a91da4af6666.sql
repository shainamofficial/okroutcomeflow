
-- File attachments table
CREATE TABLE public.file_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type public.entity_type NOT NULL,
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_type TEXT,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.file_attachments ENABLE ROW LEVEL SECURITY;

-- Users can view attachments in their org
CREATE POLICY "Users can view org file attachments"
  ON public.file_attachments FOR SELECT
  USING (is_platform_admin(auth.uid()) OR organization_id = get_user_org_id(auth.uid()));

-- Authenticated org users can upload
CREATE POLICY "Org users can create file attachments"
  ON public.file_attachments FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND uploaded_by = auth.uid()));

-- Uploaders, admins, managers can delete
CREATE POLICY "Authorized users can delete file attachments"
  ON public.file_attachments FOR DELETE
  USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (uploaded_by = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

-- Automations table
CREATE TYPE public.automation_trigger AS ENUM ('task_status_change', 'all_tasks_done', 'initiative_status_change', 'due_date_passed');
CREATE TYPE public.automation_action AS ENUM ('change_initiative_status', 'change_task_status', 'send_notification', 'create_update');

CREATE TABLE public.automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type public.automation_trigger NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}',
  action_type public.automation_action NOT NULL,
  action_config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org automations"
  ON public.automations FOR SELECT
  USING (is_platform_admin(auth.uid()) OR organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Admins and managers can create automations"
  ON public.automations FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

CREATE POLICY "Admins and managers can update automations"
  ON public.automations FOR UPDATE
  USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))))
  WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

CREATE POLICY "Admins and managers can delete automations"
  ON public.automations FOR DELETE
  USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false);

-- Storage policies
CREATE POLICY "Org users can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Org users can view attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);
