import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: string;
  created_at: string;
}

export function useTaskDependencies() {
  const { profile } = useAuth();

  const { data: dependencies = [], isLoading } = useQuery({
    queryKey: ["task_dependencies", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from("task_dependencies")
        .select("*");

      if (error) throw error;
      return data as TaskDependency[];
    },
    enabled: !!profile?.organization_id,
  });

  return { dependencies, isLoading };
}
