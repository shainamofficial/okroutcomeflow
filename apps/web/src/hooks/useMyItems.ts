import { useQuery } from "@tanstack/react-query";
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
      return (await trpc.myItems.keyResults.query()) as KeyResult[];
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
      return (await trpc.myItems.initiatives.query()) as Initiative[];
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
      return (await trpc.myItems.tasks.query()) as Task[];
    },
    enabled: !!profile?.id && !!profile?.organization_id,
  });
}
