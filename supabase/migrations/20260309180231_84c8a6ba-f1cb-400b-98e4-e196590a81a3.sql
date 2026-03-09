CREATE OR REPLACE FUNCTION public.create_new_organization(_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  calling_user uuid;
  new_org_id uuid;
BEGIN
  calling_user := auth.uid();
  
  IF calling_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF _name IS NULL OR trim(_name) = '' THEN
    RAISE EXCEPTION 'Organization name is required';
  END IF;
  
  INSERT INTO public.organizations (name)
  VALUES (trim(_name))
  RETURNING id INTO new_org_id;
  
  INSERT INTO public.organization_memberships (user_id, organization_id, is_active)
  VALUES (calling_user, new_org_id, false);
  
  INSERT INTO public.user_roles (user_id, role, organization_id)
  VALUES (calling_user, 'admin', new_org_id);
  
  RETURN new_org_id;
END;
$$;