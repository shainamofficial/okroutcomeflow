import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee_user:users_profile!tasks_assignee_user_id_fkey(id, name, email),
          assignee_team:teams!tasks_assignee_team_id_fkey(id, name)
        `)
        .eq("initiative_id", initiativeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
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

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          initiative_id: params.initiativeId,
          title: params.title,
          description: params.description || null,
          assignee_user_id: params.assigneeUserId || null,
          assignee_team_id: params.assigneeTeamId || null,
          status: params.status || "todo",
          start_date: params.startDate || null,
          due_date: params.dueDate || null,
          parent_task_id: params.parentTaskId || null,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
      const updateData: Record<string, unknown> = {};
      if (params.title !== undefined) updateData.title = params.title;
      if (params.description !== undefined) updateData.description = params.description || null;
      if (params.assigneeUserId !== undefined) updateData.assignee_user_id = params.assigneeUserId || null;
      if (params.assigneeTeamId !== undefined) updateData.assignee_team_id = params.assigneeTeamId || null;
      if (params.status !== undefined) updateData.status = params.status;
      if (params.startDate !== undefined) updateData.start_date = params.startDate || null;
      if (params.dueDate !== undefined) updateData.due_date = params.dueDate || null;
      if (params.color !== undefined) updateData.color = params.color;

      const { error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", params.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Task updated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee_user:users_profile!tasks_assignee_user_id_fkey(id, name, email),
          assignee_team:teams!tasks_assignee_team_id_fkey(id, name),
          initiative:initiatives!inner(id, organization_id)
        `)
        .eq("initiative.organization_id", profile.organization_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as (Task & { initiative: { id: string; organization_id: string }[] })[];
    },
    enabled: !!profile?.organization_id,
  });

  return { tasks, isLoading };
}
