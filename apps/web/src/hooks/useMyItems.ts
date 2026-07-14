import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import type { KeyResult } from "./useOKRs";
import type { Initiative } from "./useInitiatives";
import type { Task } from "./useTasks";

export function useMyKeyResults() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["my_key_results", profile?.id],
    queryFn: async (): Promise<KeyResult[]> => {
      if (!profile?.id || !profile?.organization_id) return [];

      if (trpc) {
        return (await trpc.myItems.keyResults.query()) as KeyResult[];
      }

      const { data, error } = await supabase
        .from("key_results")
        .select(`
          *,
          owner:users_profile!key_results_owner_id_fkey(id, name, email)
        `)
        .eq("organization_id", profile.organization_id)
        .eq("owner_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as KeyResult[];
    },
    enabled: !!profile?.id && !!profile?.organization_id,
  });
}

export function useMyInitiatives() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["my_initiatives", profile?.id],
    queryFn: async (): Promise<Initiative[]> => {
      if (!profile?.id || !profile?.organization_id) return [];

      if (trpc) {
        return (await trpc.myItems.initiatives.query()) as Initiative[];
      }

      const { data, error } = await supabase
        .from("initiatives")
        .select(`
          *,
          owner:users_profile!initiatives_owner_id_fkey(id, name, email)
        `)
        .eq("organization_id", profile.organization_id)
        .eq("owner_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Initiative[];
    },
    enabled: !!profile?.id && !!profile?.organization_id,
  });
}

export function useMyTasks() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["my_tasks", profile?.id],
    queryFn: async (): Promise<Task[]> => {
      if (!profile?.id || !profile?.organization_id) return [];

      if (trpc) {
        return (await trpc.myItems.tasks.query()) as Task[];
      }

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee_user:users_profile!tasks_assignee_user_id_fkey(id, name, email),
          assignee_team:teams!tasks_assignee_team_id_fkey(id, name),
          initiative:initiatives!inner(organization_id)
        `)
        .eq("initiative.organization_id", profile.organization_id)
        .eq("assignee_user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!profile?.id && !!profile?.organization_id,
  });
}
