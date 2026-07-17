import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Automation {
  id: string;
  organization_id: string;
  name: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  enabled: boolean;
  created_by: string | null;
  created_at: string;
}

export function useAutomations() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ["automations", profile?.organization_id],
    queryFn: async () =>
      (await trpc.automations.list.query()) as unknown as Automation[],
    enabled: !!profile?.organization_id,
  });

  const createAutomation = useMutation({
    mutationFn: async (params: {
      name: string;
      trigger_type: string;
      trigger_config?: Record<string, any>;
      action_type: string;
      action_config?: Record<string, any>;
    }) => {
      await trpc.automations.create.mutate({
        name: params.name,
        triggerType: params.trigger_type as never,
        triggerConfig: params.trigger_config || {},
        actionType: params.action_type as never,
        actionConfig: params.action_config || {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      toast({ title: "Automation created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleAutomation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      await trpc.automations.toggle.mutate({ id, enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
  });

  const deleteAutomation = useMutation({
    mutationFn: async (id: string) => {
      await trpc.automations.delete.mutate({ id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      toast({ title: "Automation deleted" });
    },
  });

  return { automations, isLoading, createAutomation, toggleAutomation, deleteAutomation };
}
