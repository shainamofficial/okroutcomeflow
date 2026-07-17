import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

export interface TaskWatcher {
  id: string;
  task_id: string;
  user_id: string;
  created_at: string;
  user?: { id: string; name: string; email: string; avatar_url: string | null };
}

export function useTaskWatchers(taskId?: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: watchers = [], isLoading } = useQuery({
    queryKey: ["task_watchers", taskId],
    queryFn: async () =>
      (await trpc.tasks.watchers.query({ taskId: taskId! })) as unknown as TaskWatcher[],
    enabled: !!taskId,
  });

  const isWatching = watchers.some((w) => w.user_id === profile?.id);

  const toggleWatch = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !taskId) throw new Error("Not authenticated");
      await trpc.tasks.toggleWatch.mutate({ taskId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task_watchers", taskId] });
    },
  });

  return { watchers, isLoading, isWatching, toggleWatch };
}
