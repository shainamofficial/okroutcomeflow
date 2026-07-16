import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
    queryFn: async () => {
      if (trpc) {
        return (await trpc.automations.list.query()) as unknown as Automation[];
      }
      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .eq("organization_id", profile!.organization_id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Automation[];
    },
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
      if (trpc) {
        await trpc.automations.create.mutate({
          name: params.name,
          triggerType: params.trigger_type as never,
          triggerConfig: params.trigger_config || {},
          actionType: params.action_type as never,
          actionConfig: params.action_config || {},
        });
        return;
      }
      const { error } = await supabase.from("automations").insert({
        organization_id: profile!.organization_id!,
        name: params.name,
        trigger_type: params.trigger_type as any,
        trigger_config: params.trigger_config || {},
        action_type: params.action_type as any,
        action_config: params.action_config || {},
        created_by: profile!.id,
      } as any);
      if (error) throw error;
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
      if (trpc) {
        await trpc.automations.toggle.mutate({ id, enabled });
        return;
      }
      const { error } = await supabase.from("automations").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
  });

  const deleteAutomation = useMutation({
    mutationFn: async (id: string) => {
      if (trpc) {
        await trpc.automations.delete.mutate({ id });
        return;
      }
      const { error } = await supabase.from("automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      toast({ title: "Automation deleted" });
    },
  });

  return { automations, isLoading, createAutomation, toggleAutomation, deleteAutomation };
}
