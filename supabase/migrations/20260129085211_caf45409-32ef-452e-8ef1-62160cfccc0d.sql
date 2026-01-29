-- Update RLS policies to allow platform admin bypass
-- Pattern: is_platform_admin(auth.uid()) OR (original_condition)

-- ===========================================
-- organizations table
-- ===========================================
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
CREATE POLICY "Users can view their own organization"
ON public.organizations FOR SELECT
USING (is_platform_admin(auth.uid()) OR id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Admins can update their organization" ON public.organizations;
CREATE POLICY "Admins can update their organization"
ON public.organizations FOR UPDATE
USING (is_platform_admin(auth.uid()) OR (id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin')))
WITH CHECK (is_platform_admin(auth.uid()) OR (id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- Platform admins can delete organizations
CREATE POLICY "Platform admins can delete organizations"
ON public.organizations FOR DELETE
USING (is_platform_admin(auth.uid()));

-- ===========================================
-- organization_domains table
-- ===========================================
DROP POLICY IF EXISTS "Users can view their organization domains" ON public.organization_domains;
CREATE POLICY "Users can view their organization domains"
ON public.organization_domains FOR SELECT
USING (is_platform_admin(auth.uid()) OR organization_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert domains for their organization" ON public.organization_domains;
CREATE POLICY "Admins can insert domains for their organization"
ON public.organization_domains FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "Admins can update domains for their organization" ON public.organization_domains;
CREATE POLICY "Admins can update domains for their organization"
ON public.organization_domains FOR UPDATE
USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin')))
WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "Admins can delete domains for their organization" ON public.organization_domains;
CREATE POLICY "Admins can delete domains for their organization"
ON public.organization_domains FOR DELETE
USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===========================================
-- users_profile table
-- ===========================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users_profile;
CREATE POLICY "Users can view their own profile"
ON public.users_profile FOR SELECT
USING (is_platform_admin(auth.uid()) OR id = auth.uid());

DROP POLICY IF EXISTS "Admins and managers can view org users" ON public.users_profile;
CREATE POLICY "Admins and managers can view org users"
ON public.users_profile FOR SELECT
USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users_profile;
CREATE POLICY "Users can update their own profile"
ON public.users_profile FOR UPDATE
USING (is_platform_admin(auth.uid()) OR id = auth.uid())
WITH CHECK (is_platform_admin(auth.uid()) OR id = auth.uid());

DROP POLICY IF EXISTS "Admins can update org users" ON public.users_profile;
CREATE POLICY "Admins can update org users"
ON public.users_profile FOR UPDATE
USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin')))
WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- Platform admins can delete users
CREATE POLICY "Platform admins can delete users"
ON public.users_profile FOR DELETE
USING (is_platform_admin(auth.uid()));

-- ===========================================
-- user_roles table
-- ===========================================
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (is_platform_admin(auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Admins and managers can view org user roles" ON public.user_roles;
CREATE POLICY "Admins and managers can view org user roles"
ON public.user_roles FOR SELECT
USING (is_platform_admin(auth.uid()) OR (EXISTS (SELECT 1 FROM users_profile up WHERE up.id = user_roles.user_id AND up.organization_id = get_user_org_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

DROP POLICY IF EXISTS "Admins can manage org user roles" ON public.user_roles;
CREATE POLICY "Admins can manage org user roles"
ON public.user_roles FOR ALL
USING (is_platform_admin(auth.uid()) OR (EXISTS (SELECT 1 FROM users_profile up WHERE up.id = user_roles.user_id AND up.organization_id = get_user_org_id(auth.uid())) AND has_role(auth.uid(), 'admin')));

-- ===========================================
-- teams table
-- ===========================================
DROP POLICY IF EXISTS "Users can view teams in their organization" ON public.teams;
CREATE POLICY "Users can view teams in their organization"
ON public.teams FOR SELECT
USING (is_platform_admin(auth.uid()) OR organization_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Admins and managers can create teams" ON public.teams;
CREATE POLICY "Admins and managers can create teams"
ON public.teams FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

DROP POLICY IF EXISTS "Admins and managers can update teams" ON public.teams;
CREATE POLICY "Admins and managers can update teams"
ON public.teams FOR UPDATE
USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))))
WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

DROP POLICY IF EXISTS "Admins and managers can delete teams" ON public.teams;
CREATE POLICY "Admins and managers can delete teams"
ON public.teams FOR DELETE
USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

-- ===========================================
-- team_members table
-- ===========================================
DROP POLICY IF EXISTS "Users can view team members in their organization" ON public.team_members;
CREATE POLICY "Users can view team members in their organization"
ON public.team_members FOR SELECT
USING (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND t.organization_id = get_user_org_id(auth.uid())));

DROP POLICY IF EXISTS "Admins and managers can add team members" ON public.team_members;
CREATE POLICY "Admins and managers can add team members"
ON public.team_members FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR (EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND t.organization_id = get_user_org_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

DROP POLICY IF EXISTS "Admins and managers can remove team members" ON public.team_members;
CREATE POLICY "Admins and managers can remove team members"
ON public.team_members FOR DELETE
USING (is_platform_admin(auth.uid()) OR (EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND t.organization_id = get_user_org_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

-- ===========================================
-- objectives table
-- ===========================================
DROP POLICY IF EXISTS "Users can view org objectives" ON public.objectives;
CREATE POLICY "Users can view org objectives"
ON public.objectives FOR SELECT
USING (is_platform_admin(auth.uid()) OR organization_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Admins and managers can create objectives" ON public.objectives;
CREATE POLICY "Admins and managers can create objectives"
ON public.objectives FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

DROP POLICY IF EXISTS "Admins and managers can update objectives" ON public.objectives;
CREATE POLICY "Admins and managers can update objectives"
ON public.objectives FOR UPDATE
USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))))
WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

DROP POLICY IF EXISTS "Admins and managers can delete objectives" ON public.objectives;
CREATE POLICY "Admins and managers can delete objectives"
ON public.objectives FOR DELETE
USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

-- ===========================================
-- key_results table
-- ===========================================
DROP POLICY IF EXISTS "Users can view org key results" ON public.key_results;
CREATE POLICY "Users can view org key results"
ON public.key_results FOR SELECT
USING (is_platform_admin(auth.uid()) OR organization_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Admins and managers can create key results" ON public.key_results;
CREATE POLICY "Admins and managers can create key results"
ON public.key_results FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

DROP POLICY IF EXISTS "Admins managers can update any KRs" ON public.key_results;
CREATE POLICY "Admins managers can update any KRs"
ON public.key_results FOR UPDATE
USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))))
WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

DROP POLICY IF EXISTS "Contributors can update owned KRs" ON public.key_results;
CREATE POLICY "Contributors can update owned KRs"
ON public.key_results FOR UPDATE
USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'contributor') AND owner_id = auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'contributor') AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "Admins and managers can delete key results" ON public.key_results;
CREATE POLICY "Admins and managers can delete key results"
ON public.key_results FOR DELETE
USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

-- ===========================================
-- initiatives table
-- ===========================================
DROP POLICY IF EXISTS "Users can view org initiatives" ON public.initiatives;
CREATE POLICY "Users can view org initiatives"
ON public.initiatives FOR SELECT
USING (is_platform_admin(auth.uid()) OR organization_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Admins and managers can create initiatives" ON public.initiatives;
CREATE POLICY "Admins and managers can create initiatives"
ON public.initiatives FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

DROP POLICY IF EXISTS "Admins and managers can update any initiatives" ON public.initiatives;
CREATE POLICY "Admins and managers can update any initiatives"
ON public.initiatives FOR UPDATE
USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))))
WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

DROP POLICY IF EXISTS "Initiative owners can update their initiatives" ON public.initiatives;
CREATE POLICY "Initiative owners can update their initiatives"
ON public.initiatives FOR UPDATE
USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND owner_id = auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "Admins and managers can delete initiatives" ON public.initiatives;
CREATE POLICY "Admins and managers can delete initiatives"
ON public.initiatives FOR DELETE
USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

-- ===========================================
-- tasks table
-- ===========================================
DROP POLICY IF EXISTS "Users can view org tasks" ON public.tasks;
CREATE POLICY "Users can view org tasks"
ON public.tasks FOR SELECT
USING (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM initiatives i WHERE i.id = tasks.initiative_id AND i.organization_id = get_user_org_id(auth.uid())));

DROP POLICY IF EXISTS "Admins managers and initiative owners can create tasks" ON public.tasks;
CREATE POLICY "Admins managers and initiative owners can create tasks"
ON public.tasks FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM initiatives i WHERE i.id = tasks.initiative_id AND i.organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR i.owner_id = auth.uid())));

DROP POLICY IF EXISTS "Authorized users can update tasks" ON public.tasks;
CREATE POLICY "Authorized users can update tasks"
ON public.tasks FOR UPDATE
USING (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM initiatives i WHERE i.id = tasks.initiative_id AND i.organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR i.owner_id = auth.uid() OR tasks.assignee_user_id = auth.uid())))
WITH CHECK (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM initiatives i WHERE i.id = tasks.initiative_id AND i.organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR i.owner_id = auth.uid() OR tasks.assignee_user_id = auth.uid())));

DROP POLICY IF EXISTS "Admins managers and initiative owners can delete tasks" ON public.tasks;
CREATE POLICY "Admins managers and initiative owners can delete tasks"
ON public.tasks FOR DELETE
USING (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM initiatives i WHERE i.id = tasks.initiative_id AND i.organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR i.owner_id = auth.uid())));

-- ===========================================
-- updates table
-- ===========================================
DROP POLICY IF EXISTS "Users can view org updates" ON public.updates;
CREATE POLICY "Users can view org updates"
ON public.updates FOR SELECT
USING (is_platform_admin(auth.uid()) OR organization_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Users can create updates" ON public.updates;
CREATE POLICY "Users can create updates"
ON public.updates FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND user_id = auth.uid() AND (update_kind = 'comment' OR can_manage_entity(auth.uid(), entity_type, entity_id))));

DROP POLICY IF EXISTS "Authorized users can update pinned status" ON public.updates;
CREATE POLICY "Authorized users can update pinned status"
ON public.updates FOR UPDATE
USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND can_manage_entity(auth.uid(), entity_type, entity_id)))
WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND can_manage_entity(auth.uid(), entity_type, entity_id)));

DROP POLICY IF EXISTS "Authors and managers can delete updates" ON public.updates;
CREATE POLICY "Authors and managers can delete updates"
ON public.updates FOR DELETE
USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

-- ===========================================
-- notifications table
-- ===========================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (is_platform_admin(auth.uid()) OR (auth.uid() IS NOT NULL AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (is_platform_admin(auth.uid()) OR user_id = auth.uid())
WITH CHECK (is_platform_admin(auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (is_platform_admin(auth.uid()) OR user_id = auth.uid());

-- ===========================================
-- user_invitations table
-- ===========================================
DROP POLICY IF EXISTS "Admins and managers can view org invitations" ON public.user_invitations;
CREATE POLICY "Admins and managers can view org invitations"
ON public.user_invitations FOR SELECT
USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

DROP POLICY IF EXISTS "Admins and managers can create invitations" ON public.user_invitations;
CREATE POLICY "Admins and managers can create invitations"
ON public.user_invitations FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

DROP POLICY IF EXISTS "Admins and managers can update invitations" ON public.user_invitations;
CREATE POLICY "Admins and managers can update invitations"
ON public.user_invitations FOR UPDATE
USING (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))))
WITH CHECK (is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))));

-- Platform admins can delete invitations
CREATE POLICY "Platform admins can delete invitations"
ON public.user_invitations FOR DELETE
USING (is_platform_admin(auth.uid()));

-- ===========================================
-- kr_metric_config table
-- ===========================================
DROP POLICY IF EXISTS "Users can view org kr metric configs" ON public.kr_metric_config;
CREATE POLICY "Users can view org kr metric configs"
ON public.kr_metric_config FOR SELECT
USING (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM key_results kr WHERE kr.id = kr_metric_config.key_result_id AND kr.organization_id = get_user_org_id(auth.uid())));

DROP POLICY IF EXISTS "Managers and owners can create kr metric configs" ON public.kr_metric_config;
CREATE POLICY "Managers and owners can create kr metric configs"
ON public.kr_metric_config FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR can_manage_kr(auth.uid(), key_result_id));

DROP POLICY IF EXISTS "Managers and owners can update kr metric configs" ON public.kr_metric_config;
CREATE POLICY "Managers and owners can update kr metric configs"
ON public.kr_metric_config FOR UPDATE
USING (is_platform_admin(auth.uid()) OR can_manage_kr(auth.uid(), key_result_id))
WITH CHECK (is_platform_admin(auth.uid()) OR can_manage_kr(auth.uid(), key_result_id));

DROP POLICY IF EXISTS "Managers and owners can delete kr metric configs" ON public.kr_metric_config;
CREATE POLICY "Managers and owners can delete kr metric configs"
ON public.kr_metric_config FOR DELETE
USING (is_platform_admin(auth.uid()) OR can_manage_kr(auth.uid(), key_result_id));

-- ===========================================
-- kr_metric_values table
-- ===========================================
DROP POLICY IF EXISTS "Users can view org kr metric values" ON public.kr_metric_values;
CREATE POLICY "Users can view org kr metric values"
ON public.kr_metric_values FOR SELECT
USING (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM kr_metric_config mc JOIN key_results kr ON kr.id = mc.key_result_id WHERE mc.id = kr_metric_values.kr_metric_config_id AND kr.organization_id = get_user_org_id(auth.uid())));

DROP POLICY IF EXISTS "Managers and owners can create kr metric values" ON public.kr_metric_values;
CREATE POLICY "Managers and owners can create kr metric values"
ON public.kr_metric_values FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM kr_metric_config mc WHERE mc.id = kr_metric_values.kr_metric_config_id AND can_manage_kr(auth.uid(), mc.key_result_id)));

DROP POLICY IF EXISTS "Managers and owners can update kr metric values" ON public.kr_metric_values;
CREATE POLICY "Managers and owners can update kr metric values"
ON public.kr_metric_values FOR UPDATE
USING (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM kr_metric_config mc WHERE mc.id = kr_metric_values.kr_metric_config_id AND can_manage_kr(auth.uid(), mc.key_result_id)))
WITH CHECK (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM kr_metric_config mc WHERE mc.id = kr_metric_values.kr_metric_config_id AND can_manage_kr(auth.uid(), mc.key_result_id)));

DROP POLICY IF EXISTS "Managers and owners can delete kr metric values" ON public.kr_metric_values;
CREATE POLICY "Managers and owners can delete kr metric values"
ON public.kr_metric_values FOR DELETE
USING (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM kr_metric_config mc WHERE mc.id = kr_metric_values.kr_metric_config_id AND can_manage_kr(auth.uid(), mc.key_result_id)));

-- ===========================================
-- kr_review_cadence table
-- ===========================================
DROP POLICY IF EXISTS "Users can view org kr_review_cadence" ON public.kr_review_cadence;
CREATE POLICY "Users can view org kr_review_cadence"
ON public.kr_review_cadence FOR SELECT
USING (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM key_results kr WHERE kr.id = kr_review_cadence.key_result_id AND kr.organization_id = get_user_org_id(auth.uid())));

DROP POLICY IF EXISTS "Managers and KR owners can insert kr_review_cadence" ON public.kr_review_cadence;
CREATE POLICY "Managers and KR owners can insert kr_review_cadence"
ON public.kr_review_cadence FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR can_manage_kr(auth.uid(), key_result_id));

DROP POLICY IF EXISTS "Managers and KR owners can update kr_review_cadence" ON public.kr_review_cadence;
CREATE POLICY "Managers and KR owners can update kr_review_cadence"
ON public.kr_review_cadence FOR UPDATE
USING (is_platform_admin(auth.uid()) OR can_manage_kr(auth.uid(), key_result_id))
WITH CHECK (is_platform_admin(auth.uid()) OR can_manage_kr(auth.uid(), key_result_id));

DROP POLICY IF EXISTS "Managers and KR owners can delete kr_review_cadence" ON public.kr_review_cadence;
CREATE POLICY "Managers and KR owners can delete kr_review_cadence"
ON public.kr_review_cadence FOR DELETE
USING (is_platform_admin(auth.uid()) OR can_manage_kr(auth.uid(), key_result_id));

-- ===========================================
-- kr_review_sessions table
-- ===========================================
DROP POLICY IF EXISTS "Users can view org kr_review_sessions" ON public.kr_review_sessions;
CREATE POLICY "Users can view org kr_review_sessions"
ON public.kr_review_sessions FOR SELECT
USING (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM key_results kr WHERE kr.id = kr_review_sessions.key_result_id AND kr.organization_id = get_user_org_id(auth.uid())));

DROP POLICY IF EXISTS "Managers and KR owners can insert kr_review_sessions" ON public.kr_review_sessions;
CREATE POLICY "Managers and KR owners can insert kr_review_sessions"
ON public.kr_review_sessions FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR can_manage_kr(auth.uid(), key_result_id));

DROP POLICY IF EXISTS "Managers and KR owners can update kr_review_sessions" ON public.kr_review_sessions;
CREATE POLICY "Managers and KR owners can update kr_review_sessions"
ON public.kr_review_sessions FOR UPDATE
USING (is_platform_admin(auth.uid()) OR can_manage_kr(auth.uid(), key_result_id))
WITH CHECK (is_platform_admin(auth.uid()) OR can_manage_kr(auth.uid(), key_result_id));

DROP POLICY IF EXISTS "Managers and KR owners can delete kr_review_sessions" ON public.kr_review_sessions;
CREATE POLICY "Managers and KR owners can delete kr_review_sessions"
ON public.kr_review_sessions FOR DELETE
USING (is_platform_admin(auth.uid()) OR can_manage_kr(auth.uid(), key_result_id));

-- ===========================================
-- kr_review_participants table
-- ===========================================
DROP POLICY IF EXISTS "Users can view org kr_review_participants" ON public.kr_review_participants;
CREATE POLICY "Users can view org kr_review_participants"
ON public.kr_review_participants FOR SELECT
USING (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM kr_review_sessions rs JOIN key_results kr ON kr.id = rs.key_result_id WHERE rs.id = kr_review_participants.review_session_id AND kr.organization_id = get_user_org_id(auth.uid())));

DROP POLICY IF EXISTS "Managers and session owners can insert kr_review_participants" ON public.kr_review_participants;
CREATE POLICY "Managers and session owners can insert kr_review_participants"
ON public.kr_review_participants FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM kr_review_sessions rs WHERE rs.id = kr_review_participants.review_session_id AND can_manage_kr(auth.uid(), rs.key_result_id)));

DROP POLICY IF EXISTS "Managers and session owners can delete kr_review_participants" ON public.kr_review_participants;
CREATE POLICY "Managers and session owners can delete kr_review_participants"
ON public.kr_review_participants FOR DELETE
USING (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM kr_review_sessions rs WHERE rs.id = kr_review_participants.review_session_id AND can_manage_kr(auth.uid(), rs.key_result_id)));

-- ===========================================
-- initiative_kr_links table
-- ===========================================
DROP POLICY IF EXISTS "Users can view org initiative_kr_links" ON public.initiative_kr_links;
CREATE POLICY "Users can view org initiative_kr_links"
ON public.initiative_kr_links FOR SELECT
USING (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM initiatives i WHERE i.id = initiative_kr_links.initiative_id AND i.organization_id = get_user_org_id(auth.uid())));

DROP POLICY IF EXISTS "Managers and owners can create initiative_kr_links" ON public.initiative_kr_links;
CREATE POLICY "Managers and owners can create initiative_kr_links"
ON public.initiative_kr_links FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM initiatives i WHERE i.id = initiative_kr_links.initiative_id AND can_manage_initiative(auth.uid(), i.id)));

DROP POLICY IF EXISTS "Managers and owners can update initiative_kr_links" ON public.initiative_kr_links;
CREATE POLICY "Managers and owners can update initiative_kr_links"
ON public.initiative_kr_links FOR UPDATE
USING (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM initiatives i WHERE i.id = initiative_kr_links.initiative_id AND can_manage_initiative(auth.uid(), i.id)))
WITH CHECK (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM initiatives i WHERE i.id = initiative_kr_links.initiative_id AND can_manage_initiative(auth.uid(), i.id)));

DROP POLICY IF EXISTS "Managers and owners can delete initiative_kr_links" ON public.initiative_kr_links;
CREATE POLICY "Managers and owners can delete initiative_kr_links"
ON public.initiative_kr_links FOR DELETE
USING (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM initiatives i WHERE i.id = initiative_kr_links.initiative_id AND can_manage_initiative(auth.uid(), i.id)));

-- ===========================================
-- update_mentions table
-- ===========================================
DROP POLICY IF EXISTS "Users can view org update mentions" ON public.update_mentions;
CREATE POLICY "Users can view org update mentions"
ON public.update_mentions FOR SELECT
USING (is_platform_admin(auth.uid()) OR get_org_id_from_update(update_id) = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Update authors can create mentions" ON public.update_mentions;
CREATE POLICY "Update authors can create mentions"
ON public.update_mentions FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM updates u WHERE u.id = update_mentions.update_id AND u.user_id = auth.uid()));

DROP POLICY IF EXISTS "Update authors can delete mentions" ON public.update_mentions;
CREATE POLICY "Update authors can delete mentions"
ON public.update_mentions FOR DELETE
USING (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM updates u WHERE u.id = update_mentions.update_id AND u.user_id = auth.uid()));

-- ===========================================
-- update_reactions table
-- ===========================================
DROP POLICY IF EXISTS "Users can view org update reactions" ON public.update_reactions;
CREATE POLICY "Users can view org update reactions"
ON public.update_reactions FOR SELECT
USING (is_platform_admin(auth.uid()) OR get_org_id_from_update(update_id) = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Org members can add reactions" ON public.update_reactions;
CREATE POLICY "Org members can add reactions"
ON public.update_reactions FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR (get_org_id_from_update(update_id) = get_user_org_id(auth.uid()) AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can remove their own reactions" ON public.update_reactions;
CREATE POLICY "Users can remove their own reactions"
ON public.update_reactions FOR DELETE
USING (is_platform_admin(auth.uid()) OR user_id = auth.uid());