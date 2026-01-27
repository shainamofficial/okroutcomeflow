-- Create enums for entity type and update kind
CREATE TYPE public.entity_type AS ENUM ('kr', 'initiative', 'task');
CREATE TYPE public.update_kind AS ENUM ('comment', 'progress', 'blocker', 'decision');

-- Create updates table
CREATE TABLE public.updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  update_kind update_kind NOT NULL,
  content TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create update_mentions table
CREATE TABLE public.update_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID NOT NULL REFERENCES public.updates(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  UNIQUE(update_id, mentioned_user_id)
);

-- Create update_reactions table
CREATE TABLE public.update_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID NOT NULL REFERENCES public.updates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  UNIQUE(update_id, user_id, reaction_type)
);

-- Create helper function to check if user can manage entity (for non-comment updates and pinning)
CREATE OR REPLACE FUNCTION public.can_manage_entity(_user_id UUID, _entity_type entity_type, _entity_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    has_role(_user_id, 'admin') OR 
    has_role(_user_id, 'manager') OR
    CASE _entity_type
      WHEN 'kr' THEN EXISTS (
        SELECT 1 FROM public.key_results 
        WHERE id = _entity_id 
        AND owner_id = _user_id
        AND organization_id = get_user_org_id(_user_id)
      )
      WHEN 'initiative' THEN EXISTS (
        SELECT 1 FROM public.initiatives 
        WHERE id = _entity_id 
        AND owner_id = _user_id
        AND organization_id = get_user_org_id(_user_id)
      )
      WHEN 'task' THEN EXISTS (
        SELECT 1 FROM public.tasks t
        JOIN public.initiatives i ON i.id = t.initiative_id
        WHERE t.id = _entity_id 
        AND i.organization_id = get_user_org_id(_user_id)
        AND (
          t.assignee_user_id = _user_id OR
          EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = t.assignee_team_id
            AND tm.user_id = _user_id
          )
        )
      )
      ELSE FALSE
    END
$$;

-- Helper function to get org id from update
CREATE OR REPLACE FUNCTION public.get_org_id_from_update(_update_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.updates WHERE id = _update_id
$$;

-- Enable RLS on all tables
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.update_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.update_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for updates table

-- SELECT: Same organization can view
CREATE POLICY "Users can view org updates"
ON public.updates FOR SELECT
USING (organization_id = get_user_org_id(auth.uid()));

-- INSERT: Org members can insert, but non-comment updates require entity ownership
CREATE POLICY "Users can create updates"
ON public.updates FOR INSERT
WITH CHECK (
  organization_id = get_user_org_id(auth.uid()) AND
  user_id = auth.uid() AND
  (
    update_kind = 'comment' OR
    can_manage_entity(auth.uid(), entity_type, entity_id)
  )
);

-- UPDATE: Only for pinning, admin/manager/entity owner
CREATE POLICY "Authorized users can update pinned status"
ON public.updates FOR UPDATE
USING (
  organization_id = get_user_org_id(auth.uid()) AND
  can_manage_entity(auth.uid(), entity_type, entity_id)
)
WITH CHECK (
  organization_id = get_user_org_id(auth.uid()) AND
  can_manage_entity(auth.uid(), entity_type, entity_id)
);

-- DELETE: Author or admin/manager
CREATE POLICY "Authors and managers can delete updates"
ON public.updates FOR DELETE
USING (
  organization_id = get_user_org_id(auth.uid()) AND
  (
    user_id = auth.uid() OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'manager')
  )
);

-- RLS Policies for update_mentions table

-- SELECT: Same organization (via update)
CREATE POLICY "Users can view org update mentions"
ON public.update_mentions FOR SELECT
USING (
  get_org_id_from_update(update_id) = get_user_org_id(auth.uid())
);

-- INSERT: Update author only
CREATE POLICY "Update authors can create mentions"
ON public.update_mentions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.updates u
    WHERE u.id = update_id
    AND u.user_id = auth.uid()
  )
);

-- DELETE: Update author only
CREATE POLICY "Update authors can delete mentions"
ON public.update_mentions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.updates u
    WHERE u.id = update_id
    AND u.user_id = auth.uid()
  )
);

-- RLS Policies for update_reactions table

-- SELECT: Same organization (via update)
CREATE POLICY "Users can view org update reactions"
ON public.update_reactions FOR SELECT
USING (
  get_org_id_from_update(update_id) = get_user_org_id(auth.uid())
);

-- INSERT: Any org member
CREATE POLICY "Org members can add reactions"
ON public.update_reactions FOR INSERT
WITH CHECK (
  get_org_id_from_update(update_id) = get_user_org_id(auth.uid()) AND
  user_id = auth.uid()
);

-- DELETE: Reaction owner only
CREATE POLICY "Users can remove their own reactions"
ON public.update_reactions FOR DELETE
USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_updates_entity ON public.updates(entity_type, entity_id);
CREATE INDEX idx_updates_organization ON public.updates(organization_id);
CREATE INDEX idx_updates_user ON public.updates(user_id);
CREATE INDEX idx_update_mentions_update ON public.update_mentions(update_id);
CREATE INDEX idx_update_reactions_update ON public.update_reactions(update_id);