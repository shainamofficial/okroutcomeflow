import { sql } from "drizzle-orm";
import { db } from "../db/client";
import { protectedProcedure, router } from "../trpc";

/**
 * API-side port of the get_dashboard_data SQL function. The RPC guarded
 * access with auth.uid(), which doesn't exist on the API's pooled
 * connection — here protectedProcedure supplies the verified orgId
 * instead. Payload shape is identical, so the frontend's DashboardData
 * type is untouched. Once the web app no longer calls the RPC directly,
 * the SQL function can be dropped.
 */
export const dashboardRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.orgId;
    const rows = (await db.execute(sql`
      WITH configs AS (
        SELECT c.id, c.key_result_id, c.start_value, c.target_value, c.direction
        FROM kr_metric_config c
        JOIN key_results kr ON kr.id = c.key_result_id
        WHERE kr.organization_id = ${orgId}
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
            ELSE
              CASE WHEN abs(l.value - c.target_value) <= abs(c.target_value) * 0.1 THEN 100 ELSE 50 END
          END AS pct
        FROM configs c
        LEFT JOIN latest l ON l.kr_metric_config_id = c.id
      ),
      kr_dist AS (
        SELECT jsonb_build_object(
          'onTrack', count(*) FILTER (WHERE pct >= 70),
          'atRisk',  count(*) FILTER (WHERE pct >= 40 AND pct < 70),
          'behind',  count(*) FILTER (WHERE pct IS NOT NULL AND pct < 40),
          'noData',  count(*) FILTER (WHERE pct IS NULL) + (
            SELECT count(*)
            FROM key_results kr
            WHERE kr.organization_id = ${orgId}
              AND NOT EXISTS (SELECT 1 FROM kr_metric_config c WHERE c.key_result_id = kr.id)
          )
        ) AS dist
        FROM progress
      ),
      task_stats AS (
        SELECT
          jsonb_build_object(
            'total',      count(*),
            'done',       count(*) FILTER (WHERE t.status = 'done'),
            'inProgress', count(*) FILTER (WHERE t.status = 'in_progress'),
            'blocked',    count(*) FILTER (WHERE t.status = 'blocked')
          ) AS ts,
          count(*)::int AS total
        FROM tasks t
        JOIN initiatives i ON i.id = t.initiative_id
        WHERE i.organization_id = ${orgId}
      ),
      upcoming AS (
        SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb) AS arr FROM (
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
          WHERE kr.organization_id = ${orgId}
            AND s.status = 'scheduled'
            AND s.review_date >= current_date
            AND s.review_date <= current_date + 7
          ORDER BY s.review_date ASC
          LIMIT 5
        ) sub
      ),
      overdue AS (
        SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb) AS arr FROM (
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
          WHERE i.organization_id = ${orgId}
            AND t.due_date < current_date
            AND t.status <> 'done'
          ORDER BY t.due_date ASC
          LIMIT 10
        ) sub
      ),
      recent AS (
        SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb) AS arr FROM (
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
          WHERE u.organization_id = ${orgId}
            AND u.created_at >= (current_date - 7)
          ORDER BY u.created_at DESC
          LIMIT 10
        ) sub
      )
      SELECT jsonb_build_object(
        'stats', jsonb_build_object(
          'objectivesCount',  (SELECT count(*) FROM objectives  WHERE organization_id = ${orgId}),
          'keyResultsCount',  (SELECT count(*) FROM key_results WHERE organization_id = ${orgId}),
          'initiativesCount', (SELECT count(*) FROM initiatives WHERE organization_id = ${orgId}),
          'tasksCount', (SELECT total FROM task_stats),
          'initiativeDistribution', (
            SELECT jsonb_build_object(
              'not_started', count(*) FILTER (WHERE status = 'not_started'),
              'in_progress', count(*) FILTER (WHERE status = 'in_progress'),
              'completed',   count(*) FILTER (WHERE status = 'completed'),
              'blocked',     count(*) FILTER (WHERE status = 'blocked')
            )
            FROM initiatives WHERE organization_id = ${orgId}
          ),
          'taskStats', (SELECT ts FROM task_stats),
          'krStatusDistribution', (SELECT dist FROM kr_dist)
        ),
        'upcomingReviews', (SELECT arr FROM upcoming),
        'overdueTasks',    (SELECT arr FROM overdue),
        'recentUpdates',   (SELECT arr FROM recent)
      ) AS payload
    `)) as unknown as Array<{ payload: unknown }>;

    return rows[0]?.payload;
  }),
});
