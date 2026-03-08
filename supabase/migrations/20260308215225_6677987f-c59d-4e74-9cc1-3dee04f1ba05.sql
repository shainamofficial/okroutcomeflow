
-- Notification preferences table
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  in_app_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification preferences" ON public.notification_preferences
  FOR SELECT TO authenticated
  USING (is_platform_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Users can manage their own notification preferences" ON public.notification_preferences
  FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()) OR user_id = auth.uid())
  WITH CHECK (is_platform_admin(auth.uid()) OR user_id = auth.uid());
