import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
    queryFn: async () => {
      if (trpc) {
        return (await trpc.tasks.watchers.query({ taskId: taskId! })) as unknown as TaskWatcher[];
      }
      const { data, error } = await supabase
        .from("task_watchers")
        .select("*, user:users_profile!task_watchers_user_id_fkey(id, name, email, avatar_url)")
        .eq("task_id", taskId!);
      if (error) throw error;
      return data as unknown as TaskWatcher[];
    },
    enabled: !!taskId,
  });

  const isWatching = watchers.some((w) => w.user_id === profile?.id);

  const toggleWatch = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !taskId) throw new Error("Not authenticated");
      if (trpc) {
        await trpc.tasks.toggleWatch.mutate({ taskId });
        return;
      }
      if (isWatching) {
        const { error } = await supabase
          .from("task_watchers")
          .delete()
          .eq("task_id", taskId)
          .eq("user_id", profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("task_watchers")
          .insert({ task_id: taskId, user_id: profile.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task_watchers", taskId] });
    },
  });

  return { watchers, isLoading, isWatching, toggleWatch };
}
