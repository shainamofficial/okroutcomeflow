-- Create objectives table
CREATE TABLE public.objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  created_by uuid REFERENCES public.users_profile(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create key_results table with self-referencing for unlimited nesting
CREATE TABLE public.key_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  objective_id uuid REFERENCES public.objectives(id) ON DELETE CASCADE,
  parent_kr_id uuid REFERENCES public.key_results(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  owner_id uuid REFERENCES public.users_profile(id),
  created_by uuid REFERENCES public.users_profile(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Constraint: Either objective_id OR parent_kr_id must be set, never both
  CONSTRAINT kr_hierarchy_check CHECK (
    (objective_id IS NOT NULL AND parent_kr_id IS NULL) OR
    (objective_id IS NULL AND parent_kr_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

-- Objectives RLS Policies

-- All org users can view objectives
CREATE POLICY "Users can view org objectives"
ON public.objectives FOR SELECT
USING (organization_id = get_user_org_id(auth.uid()));

-- Admin and Manager can create objectives
CREATE POLICY "Admins and managers can create objectives"
ON public.objectives FOR INSERT
WITH CHECK (
  organization_id = get_user_org_id(auth.uid()) AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

-- Admin and Manager can update objectives
CREATE POLICY "Admins and managers can update objectives"
ON public.objectives FOR UPDATE
USING (
  organization_id = get_user_org_id(auth.uid()) AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
)
WITH CHECK (
  organization_id = get_user_org_id(auth.uid()) AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

-- Admin and Manager can delete objectives
CREATE POLICY "Admins and managers can delete objectives"
ON public.objectives FOR DELETE
USING (
  organization_id = get_user_org_id(auth.uid()) AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

-- Key Results RLS Policies

-- All org users can view key results
CREATE POLICY "Users can view org key results"
ON public.key_results FOR SELECT
USING (organization_id = get_user_org_id(auth.uid()));

-- Admin and Manager can create key results
CREATE POLICY "Admins and managers can create key results"
ON public.key_results FOR INSERT
WITH CHECK (
  organization_id = get_user_org_id(auth.uid()) AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

-- Admin and Manager can update any key results, Contributors can update owned KRs
CREATE POLICY "Admins managers can update any KRs"
ON public.key_results FOR UPDATE
USING (
  organization_id = get_user_org_id(auth.uid()) AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
)
WITH CHECK (
  organization_id = get_user_org_id(auth.uid()) AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Contributors can update owned KRs"
ON public.key_results FOR UPDATE
USING (
  organization_id = get_user_org_id(auth.uid()) AND
  has_role(auth.uid(), 'contributor') AND
  owner_id = auth.uid()
)
WITH CHECK (
  organization_id = get_user_org_id(auth.uid()) AND
  has_role(auth.uid(), 'contributor') AND
  owner_id = auth.uid()
);

-- Admin and Manager can delete key results
CREATE POLICY "Admins and managers can delete key results"
ON public.key_results FOR DELETE
USING (
  organization_id = get_user_org_id(auth.uid()) AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_objectives_updated_at
  BEFORE UPDATE ON public.objectives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_key_results_updated_at
  BEFORE UPDATE ON public.key_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();