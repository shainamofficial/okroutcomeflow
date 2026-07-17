import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
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
      return (await trpc.tasks.dependencies.query()) as TaskDependency[];
    },
    enabled: !!profile?.organization_id,
  });

  return { dependencies, isLoading };
}
