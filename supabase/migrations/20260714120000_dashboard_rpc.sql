-- Consolidates the dashboard's ~16 client round trips into a single RPC.
-- Returns all dashboard sections (stats, KR distribution, upcoming reviews,
-- overdue tasks, recent updates) as one jsonb payload.
--
-- SECURITY DEFINER with an explicit org-membership guard, following the
-- established pattern of the other helper functions in this schema.

CREATE OR REPLACE FUNCTION public.get_dashboard_data(_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _stats jsonb;
  _kr_dist jsonb;
  _upcoming jsonb;
  _overdue jsonb;
  _recent jsonb;
BEGIN
  IF public.get_user_org_id(auth.uid()) IS DISTINCT FROM _org_id
     AND NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to access this organization';
  END IF;

  -- Entity counts + status distributions (was 13 separate count queries)
  SELECT jsonb_build_object(
    'objectivesCount', (SELECT count(*) FROM objectives WHERE organization_id = _org_id),
    'keyResultsCount', (SELECT count(*) FROM key_results WHERE organization_id = _org_id),
    'initiativesCount', (SELECT count(*) FROM initiatives WHERE organization_id = _org_id),
    'initiativeDistribution', (
      SELECT jsonb_build_object(
        'not_started', count(*) FILTER (WHERE status = 'not_started'),
        'in_progress', count(*) FILTER (WHERE status = 'in_progress'),
        'completed',   count(*) FILTER (WHERE status = 'completed'),
        'blocked',     count(*) FILTER (WHERE status = 'blocked')
      )
      FROM initiatives WHERE organization_id = _org_id
    ),
    'taskStats', (
      SELECT jsonb_build_object(
        'total',      count(*),
        'done',       count(*) FILTER (WHERE t.status = 'done'),
        'inProgress', count(*) FILTER (WHERE t.status = 'in_progress'),
        'blocked',    count(*) FILTER (WHERE t.status = 'blocked')
      )
      FROM tasks t
      JOIN initiatives i ON i.id = t.initiative_id
      WHERE i.organization_id = _org_id
    )
  )
  INTO _stats;

  -- KR status distribution. Mirrors the former client-side calculation:
  -- progress >= 70 on track, >= 40 at risk, else behind; configs without a
  -- latest value plus KRs without any config count as noData.
  WITH configs AS (
    SELECT c.id, c.key_result_id, c.start_value, c.target_value, c.direction
    FROM kr_metric_config c
    JOIN key_results kr ON kr.id = c.key_result_id
    WHERE kr.organization_id = _org_id
  ),
  latest AS (
    SELECT DISTINCT ON (v.kr_metric_config_id) v.kr_metric_config_id, v.value
    FROM kr_metric_values v
    JOIN configs c ON c.id = v.kr_metric_config_id
    ORDER BY v.kr_metric_config_id, v.date DESC
  ),
  progress AS (
    SELECT
      c.key_result_id,
      CASE
        WHEN l.kr_metric_config_id IS NULL THEN NULL
        WHEN c.direction = 'increase' THEN
          CASE WHEN c.target_value <> c.start_value
            THEN (l.value - c.start_value)::numeric / (c.target_value - c.start_value)::numeric * 100
            ELSE 0
          END
        WHEN c.direction = 'decrease' THEN
          CASE WHEN c.target_value <> c.start_value
            THEN (c.start_value - l.value)::numeric / (c.start_value - c.target_value)::numeric * 100
            ELSE 0
          END
        ELSE -- maintain: within 10% tolerance of target counts as full progress
          CASE WHEN abs(l.value - c.target_value) <= abs(c.target_value) * 0.1 THEN 100 ELSE 50 END
      END AS pct
    FROM configs c
    LEFT JOIN latest l ON l.kr_metric_config_id = c.id
  )
  SELECT jsonb_build_object(
    'onTrack', count(*) FILTER (WHERE pct >= 70),
    'atRisk',  count(*) FILTER (WHERE pct >= 40 AND pct < 70),
    'behind',  count(*) FILTER (WHERE pct IS NOT NULL AND pct < 40),
    'noData',  count(*) FILTER (WHERE pct IS NULL) + (
      SELECT count(*)
      FROM key_results kr
      WHERE kr.organization_id = _org_id
        AND NOT EXISTS (SELECT 1 FROM kr_metric_config c WHERE c.key_result_id = kr.id)
    )
  )
  INTO _kr_dist
  FROM progress;

  -- Upcoming reviews: next 7 days, max 5
  SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb) INTO _upcoming FROM (
    SELECT jsonb_build_object(
      'id', s.id,
      'review_date', s.review_date,
      'key_result', jsonb_build_object(
        'id', kr.id,
        'title', kr.title,
        'owner', CASE WHEN up.id IS NULL THEN NULL
                      ELSE jsonb_build_object('name', up.name, 'email', up.email) END
      )
    ) AS row_data
    FROM kr_review_sessions s
    JOIN key_results kr ON kr.id = s.key_result_id
    LEFT JOIN users_profile up ON up.id = kr.owner_id
    WHERE kr.organization_id = _org_id
      AND s.status = 'scheduled'
      AND s.review_date >= current_date
      AND s.review_date <= current_date + 7
    ORDER BY s.review_date ASC
    LIMIT 5
  ) sub;

  -- Overdue tasks: due before today, not done, max 10
  SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb) INTO _overdue FROM (
    SELECT jsonb_build_object(
      'id', t.id,
      'title', t.title,
      'due_date', t.due_date,
      'initiative_id', t.initiative_id,
      'assignee_user', CASE WHEN up.id IS NULL THEN NULL
                            ELSE jsonb_build_object('name', up.name, 'email', up.email) END
    ) AS row_data
    FROM tasks t
    JOIN initiatives i ON i.id = t.initiative_id
    LEFT JOIN users_profile up ON up.id = t.assignee_user_id
    WHERE i.organization_id = _org_id
      AND t.due_date < current_date
      AND t.status <> 'done'
    ORDER BY t.due_date ASC
    LIMIT 10
  ) sub;

  -- Recent updates: last 7 days, max 10
  SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb) INTO _recent FROM (
    SELECT jsonb_build_object(
      'id', u.id,
      'entity_type', u.entity_type,
      'entity_id', u.entity_id,
      'update_kind', u.update_kind,
      'content', u.content,
      'created_at', u.created_at,
      'user', CASE WHEN up.id IS NULL THEN NULL
                   ELSE jsonb_build_object('name', up.name, 'email', up.email) END
    ) AS row_data
    FROM updates u
    LEFT JOIN users_profile up ON up.id = u.user_id
    WHERE u.organization_id = _org_id
      AND u.created_at >= (current_date - 7)
    ORDER BY u.created_at DESC
    LIMIT 10
  ) sub;

  RETURN jsonb_build_object(
    'stats', _stats || jsonb_build_object(
      'tasksCount', (_stats->'taskStats'->>'total')::int,
      'krStatusDistribution', _kr_dist
    ),
    'upcomingReviews', _upcoming,
    'overdueTasks', _overdue,
    'recentUpdates', _recent
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_dashboard_data(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_data(uuid) TO authenticated;
