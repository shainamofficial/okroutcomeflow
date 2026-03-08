
-- Custom field type enum
CREATE TYPE public.custom_field_type AS ENUM ('text', 'number', 'select', 'multi_select', 'date', 'checkbox');

-- Custom field definitions (org-scoped)
CREATE TABLE public.custom_field_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  field_type public.custom_field_type NOT NULL,
  options jsonb DEFAULT '[]'::jsonb,
  entity_type public.entity_type NOT NULL DEFAULT 'task',
  created_by uuid REFERENCES public.users_profile(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name, entity_type)
);

ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org custom field definitions" ON public.custom_field_definitions
  FOR SELECT TO authenticated
  USING (is_platform_admin(auth.uid()) OR organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Admins and managers can manage custom field definitions" ON public.custom_field_definitions
  FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))))
  WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

-- Custom field values
CREATE TABLE public.custom_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_definition_id uuid NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
  entity_type public.entity_type NOT NULL,
  entity_id uuid NOT NULL,
  value jsonb NOT NULL DEFAULT '""'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(field_definition_id, entity_id)
);

ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org custom field values" ON public.custom_field_values
  FOR SELECT TO authenticated
  USING (
    is_platform_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.custom_field_definitions cfd
      WHERE cfd.id = custom_field_values.field_definition_id
      AND cfd.organization_id = get_user_org_id(auth.uid())
    )
  );

CREATE POLICY "Authorized users can manage custom field values" ON public.custom_field_values
  FOR ALL TO authenticated
  USING (
    is_platform_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.custom_field_definitions cfd
      WHERE cfd.id = custom_field_values.field_definition_id
      AND cfd.organization_id = get_user_org_id(auth.uid())
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'contributor'))
    )
  )
  WITH CHECK (
    is_platform_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.custom_field_definitions cfd
      WHERE cfd.id = custom_field_values.field_definition_id
      AND cfd.organization_id = get_user_org_id(auth.uid())
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'contributor'))
    )
  );
