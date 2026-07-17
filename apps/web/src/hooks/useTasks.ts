import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

export interface Task {
  id: string;
  initiative_id: string;
  title: string;
  description: string | null;
  assignee_user_id: string | null;
  assignee_team_id: string | null;
  status: TaskStatus;
  start_date: string | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  color: string | null;
  parent_task_id: string | null;
  assignee_user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  assignee_team?: {
    id: string;
    name: string;
  } | null;
}

export function useTasks(initiativeId?: string) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", initiativeId],
    queryFn: async () => {
      if (!initiativeId) return [];
      return (await trpc.tasks.byInitiative.query({ initiativeId })) as Task[];
    },
    enabled: !!initiativeId && !!profile?.organization_id,
  });

  const createTask = useMutation({
    mutationFn: async (params: {
      initiativeId: string;
      title: string;
      description?: string;
      assigneeUserId?: string;
      assigneeTeamId?: string;
      status?: TaskStatus;
      startDate?: string;
      dueDate?: string;
      parentTaskId?: string;
    }) => {
      if (!profile?.id) throw new Error("Not authenticated");
      return await trpc.tasks.create.mutate(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["all_tasks"] });
      toast({ title: "Task created successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTask = useMutation({
    mutationFn: async (params: {
      id: string;
      title?: string;
      description?: string;
      assigneeUserId?: string | null;
      assigneeTeamId?: string | null;
      status?: TaskStatus;
      startDate?: string | null;
      dueDate?: string | null;
      color?: string | null;
    }) => {
      await trpc.tasks.update.mutate(params);
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      await queryClient.cancelQueries({ queryKey: ["all_tasks"] });

      const previousAllTasks = queryClient.getQueryData(["all_tasks", profile?.organization_id]);
      const previousTasks = queryClient.getQueryData(["tasks", initiativeId]);

      const applyUpdate = (tasks: any[] | undefined) =>
        tasks?.map((t: any) => {
          if (t.id !== params.id) return t;
          const updated = { ...t };
          if (params.title !== undefined) updated.title = params.title;
          if (params.status !== undefined) updated.status = params.status;
          if (params.startDate !== undefined) updated.start_date = params.startDate || null;
          if (params.dueDate !== undefined) updated.due_date = params.dueDate || null;
          if (params.color !== undefined) updated.color = params.color;
          if (params.assigneeUserId !== undefined) updated.assignee_user_id = params.assigneeUserId || null;
          if (params.assigneeTeamId !== undefined) updated.assignee_team_id = params.assigneeTeamId || null;
          return updated;
        });

      queryClient.setQueryData(["tasks", initiativeId], (old: any) => applyUpdate(old));
      queryClient.setQueryData(["all_tasks", profile?.organization_id], (old: any) => applyUpdate(old));

      return { previousTasks, previousAllTasks };
    },
    onError: (error, _vars, context) => {
      if (context?.previousTasks) queryClient.setQueryData(["tasks", initiativeId], context.previousTasks);
      if (context?.previousAllTasks) queryClient.setQueryData(["all_tasks", profile?.organization_id], context.previousAllTasks);
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["all_tasks"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await trpc.tasks.delete.mutate({ id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["all_tasks"] });
      toast({ title: "Task deleted successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
  };
}

// Hook to get all tasks for filtering on initiatives page
export function useAllTasks() {
  const { profile } = useAuth();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["all_tasks", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      return (await trpc.tasks.listAll.query()) as (Task & {
        initiative: { id: string; organization_id: string };
      })[];
    },
    enabled: !!profile?.organization_id,
  });

  return { tasks, isLoading };
}
