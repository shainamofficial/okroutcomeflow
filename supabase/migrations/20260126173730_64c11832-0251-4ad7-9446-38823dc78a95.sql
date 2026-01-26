-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-logos', 'organization-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Anyone can view organization logos (public bucket)
CREATE POLICY "Organization logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'organization-logos');

-- Storage policy: Admins can upload organization logos
CREATE POLICY "Admins can upload organization logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'organization-logos' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Storage policy: Admins can update organization logos
CREATE POLICY "Admins can update organization logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'organization-logos' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Storage policy: Admins can delete organization logos
CREATE POLICY "Admins can delete organization logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'organization-logos' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update their organization
CREATE POLICY "Admins can update their organization"
ON public.organizations FOR UPDATE
USING (
  id = get_user_org_id(auth.uid()) 
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  id = get_user_org_id(auth.uid()) 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to insert domains for their organization
CREATE POLICY "Admins can insert domains for their organization"
ON public.organization_domains FOR INSERT
WITH CHECK (
  organization_id = get_user_org_id(auth.uid()) 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update domains for their organization
CREATE POLICY "Admins can update domains for their organization"
ON public.organization_domains FOR UPDATE
USING (
  organization_id = get_user_org_id(auth.uid()) 
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  organization_id = get_user_org_id(auth.uid()) 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete domains for their organization
CREATE POLICY "Admins can delete domains for their organization"
ON public.organization_domains FOR DELETE
USING (
  organization_id = get_user_org_id(auth.uid()) 
  AND public.has_role(auth.uid(), 'admin')
);

-- Function to check if a domain exists globally (for other organizations)
CREATE OR REPLACE FUNCTION public.domain_exists_for_other_org(_domain text, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_domains
    WHERE domain = lower(trim(_domain))
      AND organization_id != _org_id
  )
$$;