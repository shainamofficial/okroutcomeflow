-- Create direction enum
CREATE TYPE public.metric_direction AS ENUM ('increase', 'decrease', 'maintain');

-- Create kr_metric_config table
CREATE TABLE public.kr_metric_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_result_id uuid NOT NULL REFERENCES public.key_results(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  unit text NOT NULL,
  direction metric_direction NOT NULL,
  start_value numeric NOT NULL,
  target_value numeric NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  CONSTRAINT kr_metric_config_unique UNIQUE (key_result_id)
);

-- Create kr_metric_values table
CREATE TABLE public.kr_metric_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kr_metric_config_id uuid NOT NULL REFERENCES public.kr_metric_config(id) ON DELETE CASCADE,
  date date NOT NULL,
  value numeric NOT NULL,
  created_by uuid REFERENCES public.users_profile(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kr_metric_values_unique UNIQUE (kr_metric_config_id, date)
);

-- Enable RLS
ALTER TABLE public.kr_metric_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kr_metric_values ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user can manage a key result (admin, manager, or owner)
CREATE OR REPLACE FUNCTION public.can_manage_kr(_user_id uuid, _kr_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    has_role(_user_id, 'admin') OR 
    has_role(_user_id, 'manager') OR
    EXISTS (
      SELECT 1 FROM public.key_results 
      WHERE id = _kr_id 
      AND owner_id = _user_id
      AND organization_id = get_user_org_id(_user_id)
    )
$$;

-- Helper function to get org_id from kr_metric_config
CREATE OR REPLACE FUNCTION public.get_org_id_from_metric_config(_config_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT kr.organization_id
  FROM public.kr_metric_config mc
  JOIN public.key_results kr ON kr.id = mc.key_result_id
  WHERE mc.id = _config_id
$$;

-- kr_metric_config RLS Policies

-- All org users can view metric configs for their org's KRs
CREATE POLICY "Users can view org kr metric configs"
ON public.kr_metric_config FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.key_results kr
    WHERE kr.id = kr_metric_config.key_result_id
    AND kr.organization_id = get_user_org_id(auth.uid())
  )
);

-- Admin, Manager, or KR owner can create metric config
CREATE POLICY "Managers and owners can create kr metric configs"
ON public.kr_metric_config FOR INSERT
WITH CHECK (
  can_manage_kr(auth.uid(), key_result_id)
);

-- Admin, Manager, or KR owner can update metric config
CREATE POLICY "Managers and owners can update kr metric configs"
ON public.kr_metric_config FOR UPDATE
USING (can_manage_kr(auth.uid(), key_result_id))
WITH CHECK (can_manage_kr(auth.uid(), key_result_id));

-- Admin, Manager, or KR owner can delete metric config
CREATE POLICY "Managers and owners can delete kr metric configs"
ON public.kr_metric_config FOR DELETE
USING (can_manage_kr(auth.uid(), key_result_id));

-- kr_metric_values RLS Policies

-- All org users can view metric values
CREATE POLICY "Users can view org kr metric values"
ON public.kr_metric_values FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.kr_metric_config mc
    JOIN public.key_results kr ON kr.id = mc.key_result_id
    WHERE mc.id = kr_metric_values.kr_metric_config_id
    AND kr.organization_id = get_user_org_id(auth.uid())
  )
);

-- Admin, Manager, or KR owner can create metric values
CREATE POLICY "Managers and owners can create kr metric values"
ON public.kr_metric_values FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.kr_metric_config mc
    WHERE mc.id = kr_metric_values.kr_metric_config_id
    AND can_manage_kr(auth.uid(), mc.key_result_id)
  )
);

-- Admin, Manager, or KR owner can update metric values
CREATE POLICY "Managers and owners can update kr metric values"
ON public.kr_metric_values FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.kr_metric_config mc
    WHERE mc.id = kr_metric_values.kr_metric_config_id
    AND can_manage_kr(auth.uid(), mc.key_result_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.kr_metric_config mc
    WHERE mc.id = kr_metric_values.kr_metric_config_id
    AND can_manage_kr(auth.uid(), mc.key_result_id)
  )
);

-- Admin, Manager, or KR owner can delete metric values
CREATE POLICY "Managers and owners can delete kr metric values"
ON public.kr_metric_values FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.kr_metric_config mc
    WHERE mc.id = kr_metric_values.kr_metric_config_id
    AND can_manage_kr(auth.uid(), mc.key_result_id)
  )
);