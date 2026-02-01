import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

      const { data, error } = await supabase
        .from("initiatives")
        .select(`
          *,
          owner:users_profile!initiatives_owner_id_fkey(id, name, email)
        `)
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Initiative[];
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

      const { data: initiative, error } = await supabase
        .from("initiatives")
        .insert({
          organization_id: profile.organization_id,
          title: params.title,
          description: params.description || null,
          owner_id: params.ownerId || null,
          status: params.status || "not_started",
          start_date: params.startDate || null,
          end_date: params.endDate || null,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create KR links if provided
      if (params.linkedKRs && params.linkedKRs.length > 0) {
        const links = params.linkedKRs.map((link) => ({
          initiative_id: initiative.id,
          key_result_id: link.krId,
          weight: link.weight || null,
        }));

        const { error: linkError } = await supabase
          .from("initiative_kr_links")
          .insert(links);

        if (linkError) throw linkError;
      }

      return initiative;
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
      const updateData: Record<string, unknown> = {};
      if (params.title !== undefined) updateData.title = params.title;
      if (params.description !== undefined) updateData.description = params.description || null;
      if (params.ownerId !== undefined) updateData.owner_id = params.ownerId || null;
      if (params.status !== undefined) updateData.status = params.status;
      if (params.startDate !== undefined) updateData.start_date = params.startDate || null;
      if (params.endDate !== undefined) updateData.end_date = params.endDate || null;
      if (params.color !== undefined) updateData.color = params.color;

      const { error } = await supabase
        .from("initiatives")
        .update(updateData)
        .eq("id", params.id);

      if (error) throw error;

      // Update KR links if provided
      if (params.linkedKRs !== undefined) {
        // Delete existing links
        await supabase
          .from("initiative_kr_links")
          .delete()
          .eq("initiative_id", params.id);

        // Create new links
        if (params.linkedKRs.length > 0) {
          const links = params.linkedKRs.map((link) => ({
            initiative_id: params.id,
            key_result_id: link.krId,
            weight: link.weight || null,
          }));

          const { error: linkError } = await supabase
            .from("initiative_kr_links")
            .insert(links);

          if (linkError) throw linkError;
        }
      }
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
      const { error } = await supabase.from("initiatives").delete().eq("id", id);
      if (error) throw error;
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

      const { data, error } = await supabase
        .from("initiative_kr_links")
        .select(`
          *,
          key_result:key_results(id, title, objective_id)
        `)
        .eq("initiative_id", initiativeId);

      if (error) throw error;
      return data as InitiativeKRLink[];
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

      const { data, error } = await supabase
        .from("initiative_kr_links")
        .select(`
          *,
          initiative:initiatives(
            id,
            organization_id,
            title,
            description,
            owner_id,
            status,
            start_date,
            end_date,
            created_by,
            created_at,
            owner:users_profile!initiatives_owner_id_fkey(id, name, email)
          )
        `)
        .eq("key_result_id", keyResultId);

      if (error) throw error;
      return data;
    },
    enabled: !!keyResultId && !!profile?.organization_id,
  });

  return { initiatives, isLoading };
}
