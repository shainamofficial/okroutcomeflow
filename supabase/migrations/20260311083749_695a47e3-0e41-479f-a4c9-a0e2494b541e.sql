
-- Table: initiative_share_links
CREATE TABLE public.initiative_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  created_by uuid REFERENCES public.users_profile(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.initiative_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Initiative managers can manage share links"
  ON public.initiative_share_links
  FOR ALL
  TO authenticated
  USING (can_manage_initiative(auth.uid(), initiative_id))
  WITH CHECK (can_manage_initiative(auth.uid(), initiative_id));

CREATE POLICY "Platform admins can manage share links"
  ON public.initiative_share_links
  FOR ALL
  TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- Table: initiative_share_viewers
CREATE TABLE public.initiative_share_viewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id uuid NOT NULL REFERENCES public.initiative_share_links(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(share_link_id, email)
);

ALTER TABLE public.initiative_share_viewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Share link managers can manage viewers"
  ON public.initiative_share_viewers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.initiative_share_links sl
      WHERE sl.id = initiative_share_viewers.share_link_id
      AND can_manage_initiative(auth.uid(), sl.initiative_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.initiative_share_links sl
      WHERE sl.id = initiative_share_viewers.share_link_id
      AND can_manage_initiative(auth.uid(), sl.initiative_id)
    )
  );

CREATE POLICY "Platform admins can manage viewers"
  ON public.initiative_share_viewers
  FOR ALL
  TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));
