-- Create review frequency enum
CREATE TYPE public.review_frequency AS ENUM ('weekly', 'biweekly', 'monthly', 'quarterly');

-- Create review session status enum
CREATE TYPE public.review_session_status AS ENUM ('scheduled', 'completed', 'cancelled');

-- Create kr_review_cadence table
CREATE TABLE public.kr_review_cadence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_result_id UUID NOT NULL REFERENCES public.key_results(id) ON DELETE CASCADE,
  frequency review_frequency NOT NULL,
  day_of_week INT CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
  time TEXT NOT NULL DEFAULT '09:00',
  next_review_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_kr_cadence UNIQUE (key_result_id)
);

-- Create kr_review_sessions table
CREATE TABLE public.kr_review_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_result_id UUID NOT NULL REFERENCES public.key_results(id) ON DELETE CASCADE,
  review_date DATE NOT NULL,
  status review_session_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create kr_review_participants table
CREATE TABLE public.kr_review_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_session_id UUID NOT NULL REFERENCES public.kr_review_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users_profile(id),
  
  CONSTRAINT unique_session_participant UNIQUE (review_session_id, user_id)
);

-- Enable RLS
ALTER TABLE public.kr_review_cadence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kr_review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kr_review_participants ENABLE ROW LEVEL SECURITY;

-- RLS for kr_review_cadence
CREATE POLICY "Users can view org kr_review_cadence"
ON public.kr_review_cadence FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.key_results kr
    WHERE kr.id = kr_review_cadence.key_result_id
    AND kr.organization_id = get_user_org_id(auth.uid())
  )
);

CREATE POLICY "Managers and KR owners can insert kr_review_cadence"
ON public.kr_review_cadence FOR INSERT
WITH CHECK (can_manage_kr(auth.uid(), key_result_id));

CREATE POLICY "Managers and KR owners can update kr_review_cadence"
ON public.kr_review_cadence FOR UPDATE
USING (can_manage_kr(auth.uid(), key_result_id))
WITH CHECK (can_manage_kr(auth.uid(), key_result_id));

CREATE POLICY "Managers and KR owners can delete kr_review_cadence"
ON public.kr_review_cadence FOR DELETE
USING (can_manage_kr(auth.uid(), key_result_id));

-- RLS for kr_review_sessions
CREATE POLICY "Users can view org kr_review_sessions"
ON public.kr_review_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.key_results kr
    WHERE kr.id = kr_review_sessions.key_result_id
    AND kr.organization_id = get_user_org_id(auth.uid())
  )
);

CREATE POLICY "Managers and KR owners can insert kr_review_sessions"
ON public.kr_review_sessions FOR INSERT
WITH CHECK (can_manage_kr(auth.uid(), key_result_id));

CREATE POLICY "Managers and KR owners can update kr_review_sessions"
ON public.kr_review_sessions FOR UPDATE
USING (can_manage_kr(auth.uid(), key_result_id))
WITH CHECK (can_manage_kr(auth.uid(), key_result_id));

CREATE POLICY "Managers and KR owners can delete kr_review_sessions"
ON public.kr_review_sessions FOR DELETE
USING (can_manage_kr(auth.uid(), key_result_id));

-- RLS for kr_review_participants
CREATE POLICY "Users can view org kr_review_participants"
ON public.kr_review_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.kr_review_sessions rs
    JOIN public.key_results kr ON kr.id = rs.key_result_id
    WHERE rs.id = kr_review_participants.review_session_id
    AND kr.organization_id = get_user_org_id(auth.uid())
  )
);

CREATE POLICY "Managers and session owners can insert kr_review_participants"
ON public.kr_review_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.kr_review_sessions rs
    WHERE rs.id = kr_review_participants.review_session_id
    AND can_manage_kr(auth.uid(), rs.key_result_id)
  )
);

CREATE POLICY "Managers and session owners can delete kr_review_participants"
ON public.kr_review_participants FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.kr_review_sessions rs
    WHERE rs.id = kr_review_participants.review_session_id
    AND can_manage_kr(auth.uid(), rs.key_result_id)
  )
);