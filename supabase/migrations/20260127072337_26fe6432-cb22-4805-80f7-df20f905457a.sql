-- Create initiative status enum
CREATE TYPE public.initiative_status AS ENUM ('not_started', 'in_progress', 'completed', 'blocked');

-- Create initiatives table
CREATE TABLE public.initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.users_profile(id),
  status initiative_status NOT NULL DEFAULT 'not_started',
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES public.users_profile(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create initiative_kr_links table
CREATE TABLE public.initiative_kr_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  key_result_id UUID NOT NULL REFERENCES public.key_results(id) ON DELETE CASCADE,
  weight NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(initiative_id, key_result_id)
);

-- Enable RLS
ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiative_kr_links ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user can manage initiative
CREATE OR REPLACE FUNCTION public.can_manage_initiative(_user_id UUID, _initiative_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    has_role(_user_id, 'admin') OR 
    has_role(_user_id, 'manager') OR
    EXISTS (
      SELECT 1 FROM public.initiatives 
      WHERE id = _initiative_id 
      AND owner_id = _user_id
      AND organization_id = get_user_org_id(_user_id)
    )
$$;

-- RLS Policies for initiatives
CREATE POLICY "Users can view org initiatives"
ON public.initiatives FOR SELECT
USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Admins and managers can create initiatives"
ON public.initiatives FOR INSERT
WITH CHECK (
  organization_id = get_user_org_id(auth.uid()) AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins and managers can update any initiatives"
ON public.initiatives FOR UPDATE
USING (
  organization_id = get_user_org_id(auth.uid()) AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
)
WITH CHECK (
  organization_id = get_user_org_id(auth.uid()) AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Initiative owners can update their initiatives"
ON public.initiatives FOR UPDATE
USING (
  organization_id = get_user_org_id(auth.uid()) AND
  owner_id = auth.uid()
)
WITH CHECK (
  organization_id = get_user_org_id(auth.uid()) AND
  owner_id = auth.uid()
);

CREATE POLICY "Admins and managers can delete initiatives"
ON public.initiatives FOR DELETE
USING (
  organization_id = get_user_org_id(auth.uid()) AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

-- RLS Policies for initiative_kr_links
CREATE POLICY "Users can view org initiative_kr_links"
ON public.initiative_kr_links FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = initiative_kr_links.initiative_id
    AND i.organization_id = get_user_org_id(auth.uid())
  )
);

CREATE POLICY "Managers and owners can create initiative_kr_links"
ON public.initiative_kr_links FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = initiative_kr_links.initiative_id
    AND can_manage_initiative(auth.uid(), i.id)
  )
);

CREATE POLICY "Managers and owners can update initiative_kr_links"
ON public.initiative_kr_links FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = initiative_kr_links.initiative_id
    AND can_manage_initiative(auth.uid(), i.id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = initiative_kr_links.initiative_id
    AND can_manage_initiative(auth.uid(), i.id)
  )
);

CREATE POLICY "Managers and owners can delete initiative_kr_links"
ON public.initiative_kr_links FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = initiative_kr_links.initiative_id
    AND can_manage_initiative(auth.uid(), i.id)
  )
);

-- Add check constraint to ensure initiative and KR belong to same org
CREATE OR REPLACE FUNCTION public.check_initiative_kr_same_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  initiative_org UUID;
  kr_org UUID;
BEGIN
  SELECT organization_id INTO initiative_org FROM public.initiatives WHERE id = NEW.initiative_id;
  SELECT organization_id INTO kr_org FROM public.key_results WHERE id = NEW.key_result_id;
  
  IF initiative_org != kr_org THEN
    RAISE EXCEPTION 'Initiative and Key Result must belong to the same organization';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_initiative_kr_org
BEFORE INSERT OR UPDATE ON public.initiative_kr_links
FOR EACH ROW
EXECUTE FUNCTION public.check_initiative_kr_same_org();