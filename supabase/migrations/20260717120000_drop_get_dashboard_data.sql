-- Drop the now-unused get_dashboard_data RPC. The dashboard is served by the
-- owned API (dashboard.get), which reimplements the same aggregation in TS;
-- the frontend no longer calls this function (removed with the dead Supabase
-- data-fallback branches in Phase 5).
DROP FUNCTION IF EXISTS public.get_dashboard_data(uuid);
