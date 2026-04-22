import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { addDays, format, subDays, isBefore } from "date-fns";

export interface DashboardStats {
  objectivesCount: number;
  keyResultsCount: number;
  initiativesCount: number;
  tasksCount: number;
  krStatusDistribution: {
    onTrack: number;
    atRisk: number;
    behind: number;
    noData: number;
  };
  initiativeDistribution: {
    not_started: number;
    in_progress: number;
    completed: number;
    blocked: number;
  };
  taskStats: {
    total: number;
    done: number;
    inProgress: number;
    blocked: number;
  };
}

export interface UpcomingReview {
  id: string;
  review_date: string;
  key_result: {
    id: string;
    title: string;
    owner?: {
      name: string;
      email: string;
    } | null;
  };
}

export interface OverdueTask {
  id: string;
  title: string;
  due_date: string;
  initiative_id: string;
  assignee_user?: {
    name: string;
    email: string;
  } | null;
}

export interface RecentUpdate {
  id: string;
  entity_type: string;
  entity_id: string;
  update_kind: string;
  content: string;
  created_at: string;
  user: {
    name: string;
    email: string;
  } | null;
}

export function useDashboardStats() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["dashboard_stats", profile?.organization_id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!profile?.organization_id) {
        return {
          objectivesCount: 0,
          keyResultsCount: 0,
          initiativesCount: 0,
          tasksCount: 0,
          krStatusDistribution: { onTrack: 0, atRisk: 0, behind: 0, noData: 0 },
          initiativeDistribution: { not_started: 0, in_progress: 0, completed: 0, blocked: 0 },
          taskStats: { total: 0, done: 0, inProgress: 0, blocked: 0 },
        };
      }

      const orgId = profile.organization_id;

      const initiativeStatusCount = (status: "not_started" | "in_progress" | "completed" | "blocked") =>
        supabase
          .from("initiatives")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("status", status);

      const taskStatusCount = (status: "done" | "in_progress" | "blocked") =>
        supabase
          .from("tasks")
          .select("id, initiative:initiatives!inner(organization_id)", { count: "exact", head: true })
          .eq("initiative.organization_id", orgId)
          .eq("status", status);

      // Fetch counts in parallel
      const [
        objectives,
        keyResults,
        initiatives,
        tasks,
        metricConfigs,
        metricValues,
        initNotStarted,
        initInProgress,
        initCompleted,
        initBlocked,
        tasksDone,
        tasksInProgress,
        tasksBlocked,
      ] = await Promise.all([
        supabase
          .from("objectives")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId),
        supabase
          .from("key_results")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId),
        supabase
          .from("initiatives")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId),
        supabase
          .from("tasks")
          .select("id, initiative:initiatives!inner(organization_id)", { count: "exact", head: true })
          .eq("initiative.organization_id", orgId),
        supabase
          .from("kr_metric_config")
          .select("id, key_result_id, start_value, target_value, direction, key_result:key_results!inner(organization_id)")
          .eq("key_result.organization_id", orgId),
        supabase
          .from("kr_metric_values")
          .select("kr_metric_config_id, value, date")
          .order("date", { ascending: false }),
        initiativeStatusCount("not_started"),
        initiativeStatusCount("in_progress"),
        initiativeStatusCount("completed"),
        initiativeStatusCount("blocked"),
        taskStatusCount("done"),
        taskStatusCount("in_progress"),
        taskStatusCount("blocked"),
      ]);

      // Calculate KR status distribution based on progress
      let onTrack = 0;
      let atRisk = 0;
      let behind = 0;
      let noData = 0;

      const configs = metricConfigs.data || [];
      const values = metricValues.data || [];

      const krCount = keyResults.count || 0;
      const configuredKrs = new Set(configs.map(c => c.key_result_id));

      for (const config of configs) {
        const latestValue = values.find(v => v.kr_metric_config_id === config.id);
        
        if (!latestValue) {
          noData++;
          continue;
        }

        const start = config.start_value;
        const target = config.target_value;
        const current = latestValue.value;
        
        let progress = 0;
        if (config.direction === "increase") {
          progress = target !== start ? ((current - start) / (target - start)) * 100 : 0;
        } else if (config.direction === "decrease") {
          progress = target !== start ? ((start - current) / (start - target)) * 100 : 0;
        } else {
          // maintain
          const deviation = Math.abs(current - target);
          const tolerance = Math.abs(target) * 0.1;
          progress = deviation <= tolerance ? 100 : 50;
        }

        if (progress >= 70) {
          onTrack++;
        } else if (progress >= 40) {
          atRisk++;
        } else {
          behind++;
        }
      }

      // KRs without metric config
      noData += krCount - configuredKrs.size;

      const tasksCount = tasks.count || 0;

      return {
        objectivesCount: objectives.count || 0,
        keyResultsCount: krCount,
        initiativesCount: initiatives.count || 0,
        tasksCount,
        krStatusDistribution: { onTrack, atRisk, behind, noData },
        initiativeDistribution: {
          not_started: initNotStarted.count || 0,
          in_progress: initInProgress.count || 0,
          completed: initCompleted.count || 0,
          blocked: initBlocked.count || 0,
        },
        taskStats: {
          total: tasksCount,
          done: tasksDone.count || 0,
          inProgress: tasksInProgress.count || 0,
          blocked: tasksBlocked.count || 0,
        },
      };
    },
    enabled: !!profile?.organization_id,
  });
}

export function useUpcomingReviews() {
  const { profile } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const nextWeek = format(addDays(new Date(), 7), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["upcoming_reviews", profile?.organization_id],
    queryFn: async (): Promise<UpcomingReview[]> => {
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from("kr_review_sessions")
        .select(`
          id,
          review_date,
          key_result:key_results!inner(
            id,
            title,
            organization_id,
            owner:users_profile!key_results_owner_id_fkey(name, email)
          )
        `)
        .eq("status", "scheduled")
        .eq("key_result.organization_id", profile.organization_id)
        .gte("review_date", today)
        .lte("review_date", nextWeek)
        .order("review_date", { ascending: true })
        .limit(5);

      if (error) throw error;
      return (data || []) as unknown as UpcomingReview[];
    },
    enabled: !!profile?.organization_id,
  });
}

export function useOverdueTasks() {
  const { profile } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["overdue_tasks", profile?.organization_id],
    queryFn: async (): Promise<OverdueTask[]> => {
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          due_date,
          initiative_id,
          initiative:initiatives!inner(organization_id),
          assignee_user:users_profile!tasks_assignee_user_id_fkey(name, email)
        `)
        .eq("initiative.organization_id", profile.organization_id)
        .lt("due_date", today)
        .neq("status", "done")
        .order("due_date", { ascending: true })
        .limit(10);

      if (error) throw error;
      return (data || []) as unknown as OverdueTask[];
    },
    enabled: !!profile?.organization_id,
  });
}

export function useRecentUpdates() {
  const { profile } = useAuth();
  const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["recent_updates", profile?.organization_id],
    queryFn: async (): Promise<RecentUpdate[]> => {
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from("updates")
        .select(`
          id,
          entity_type,
          entity_id,
          update_kind,
          content,
          created_at,
          user:users_profile!updates_user_id_fkey(name, email)
        `)
        .eq("organization_id", profile.organization_id)
        .gte("created_at", weekAgo)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []) as unknown as RecentUpdate[];
    },
    enabled: !!profile?.organization_id,
  });
}
