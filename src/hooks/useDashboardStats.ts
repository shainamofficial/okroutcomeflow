import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

interface DashboardData {
  stats: DashboardStats;
  upcomingReviews: UpcomingReview[];
  overdueTasks: OverdueTask[];
  recentUpdates: RecentUpdate[];
}

// All four dashboard hooks share this single query (same key -> one fetch).
// The get_dashboard_data RPC computes every section server-side, replacing
// the ~16 browser-to-database round trips the dashboard previously made.
function useDashboardData<T>(select: (data: DashboardData) => T) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["dashboard_data", profile?.organization_id],
    queryFn: async (): Promise<DashboardData> => {
      const { data, error } = await supabase.rpc("get_dashboard_data", {
        _org_id: profile!.organization_id!,
      });
      if (error) throw error;
      return data as unknown as DashboardData;
    },
    select,
    enabled: !!profile?.organization_id,
  });
}

export function useDashboardStats() {
  return useDashboardData((d) => d.stats);
}

export function useUpcomingReviews() {
  return useDashboardData((d) => d.upcomingReviews);
}

export function useOverdueTasks() {
  return useDashboardData((d) => d.overdueTasks);
}

export function useRecentUpdates() {
  return useDashboardData((d) => d.recentUpdates);
}
