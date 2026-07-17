import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type InitiativeStatus = "not_started" | "in_progress" | "completed" | "blocked";

export interface Initiative {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  owner_id: string | null;
  status: InitiativeStatus;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
  color: string | null;
  owner?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface InitiativeKRLink {
  id: string;
  initiative_id: string;
  key_result_id: string;
  weight: number | null;
  created_at: string;
  key_result?: {
    id: string;
    title: string;
    objective_id: string | null;
  };
}

export function useInitiatives() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: initiatives = [], isLoading } = useQuery({
    queryKey: ["initiatives", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      return (await trpc.initiatives.list.query()) as Initiative[];
    },
    enabled: !!profile?.organization_id,
  });

  const createInitiative = useMutation({
    mutationFn: async (params: {
      title: string;
      description?: string;
      ownerId?: string;
      status?: InitiativeStatus;
      startDate?: string;
      endDate?: string;
      linkedKRs?: { krId: string; weight?: number }[];
    }) => {
      if (!profile?.organization_id) throw new Error("No organization");
      return await trpc.initiatives.create.mutate(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initiatives"] });
      queryClient.invalidateQueries({ queryKey: ["initiative_kr_links"] });
      toast({ title: "Initiative created successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create initiative",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateInitiative = useMutation({
    mutationFn: async (params: {
      id: string;
      title?: string;
      description?: string;
      ownerId?: string;
      status?: InitiativeStatus;
      startDate?: string;
      endDate?: string;
      linkedKRs?: { krId: string; weight?: number }[];
      color?: string | null;
    }) => {
      await trpc.initiatives.update.mutate(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initiatives"] });
      queryClient.invalidateQueries({ queryKey: ["initiative_kr_links"] });
      toast({ title: "Initiative updated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update initiative",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteInitiative = useMutation({
    mutationFn: async (id: string) => {
      await trpc.initiatives.delete.mutate({ id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initiatives"] });
      queryClient.invalidateQueries({ queryKey: ["initiative_kr_links"] });
      toast({ title: "Initiative deleted successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete initiative",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    initiatives,
    isLoading,
    createInitiative,
    updateInitiative,
    deleteInitiative,
  };
}

export function useInitiativeKRLinks(initiativeId?: string) {
  const { profile } = useAuth();

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["initiative_kr_links", initiativeId],
    queryFn: async () => {
      if (!initiativeId) return [];
      return (await trpc.initiatives.krLinks.query({ initiativeId })) as unknown as InitiativeKRLink[];
    },
    enabled: !!initiativeId && !!profile?.organization_id,
  });

  return { links, isLoading };
}

export function useKRInitiativeLinks(keyResultId?: string) {
  const { profile } = useAuth();

  const { data: initiatives = [], isLoading } = useQuery({
    queryKey: ["kr_initiative_links", keyResultId],
    queryFn: async () => {
      if (!keyResultId) return [];
      return await trpc.initiatives.initiativeLinks.query({ keyResultId });
    },
    enabled: !!keyResultId && !!profile?.organization_id,
  });

  return { initiatives, isLoading };
}
