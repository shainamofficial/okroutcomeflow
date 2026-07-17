import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Objective {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface KeyResult {
  id: string;
  organization_id: string;
  objective_id: string | null;
  parent_kr_id: string | null;
  title: string;
  description: string | null;
  owner_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export function useObjectives() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: objectives = [], isLoading } = useQuery({
    queryKey: ["objectives", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      return (await trpc.objectives.list.query()) as Objective[];
    },
    enabled: !!profile?.organization_id,
  });

  const createObjective = useMutation({
    mutationFn: async ({
      title,
      description,
    }: {
      title: string;
      description?: string;
    }) => {
      if (!profile?.organization_id || !profile?.id) {
        throw new Error("No organization or user");
      }
      return await trpc.objectives.create.mutate({ title, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      toast({ title: "Objective created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create objective",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateObjective = useMutation({
    mutationFn: async ({
      id,
      title,
      description,
    }: {
      id: string;
      title: string;
      description?: string;
    }) => {
      await trpc.objectives.update.mutate({ id, title, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      toast({ title: "Objective updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update objective",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteObjective = useMutation({
    mutationFn: async (id: string) => {
      await trpc.objectives.delete.mutate({ id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      queryClient.invalidateQueries({ queryKey: ["key-results"] });
      toast({ title: "Objective deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete objective",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    objectives,
    isLoading,
    createObjective,
    updateObjective,
    deleteObjective,
  };
}

export function useKeyResults(objectiveId?: string) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: keyResults = [], isLoading } = useQuery({
    queryKey: ["key-results", profile?.organization_id, objectiveId],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      return (await trpc.okrs.keyResults.query(
        objectiveId ? { objectiveId } : undefined
      )) as KeyResult[];
    },
    enabled: !!profile?.organization_id,
  });

  const createKeyResult = useMutation({
    mutationFn: async ({
      title,
      description,
      objectiveId,
      parentKrId,
      ownerId,
    }: {
      title: string;
      description?: string;
      objectiveId?: string;
      parentKrId?: string;
      ownerId?: string;
    }) => {
      if (!profile?.organization_id || !profile?.id) {
        throw new Error("No organization or user");
      }

      // Validate hierarchy: exactly one of objectiveId or parentKrId must be set
      if (!objectiveId && !parentKrId) {
        throw new Error("Key Result must belong to an Objective or a parent Key Result");
      }
      if (objectiveId && parentKrId) {
        throw new Error("Key Result cannot belong to both an Objective and a parent Key Result");
      }

      return await trpc.okrs.createKeyResult.mutate({
        title,
        description,
        objectiveId,
        parentKrId,
        ownerId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key-results"] });
      queryClient.invalidateQueries({ queryKey: ["all-key-results"] });
      toast({ title: "Key Result created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create Key Result",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateKeyResult = useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      ownerId,
    }: {
      id: string;
      title: string;
      description?: string;
      ownerId?: string;
    }) => {
      await trpc.okrs.updateKeyResult.mutate({ id, title, description, ownerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key-results"] });
      toast({ title: "Key Result updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update Key Result",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteKeyResult = useMutation({
    mutationFn: async (id: string) => {
      await trpc.okrs.deleteKeyResult.mutate({ id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key-results"] });
      toast({ title: "Key Result deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete Key Result",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    keyResults,
    isLoading,
    createKeyResult,
    updateKeyResult,
    deleteKeyResult,
  };
}

export function useAllKeyResults() {
  const { profile } = useAuth();

  const { data: keyResults = [], isLoading } = useQuery({
    queryKey: ["all-key-results", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      return (await trpc.okrs.keyResults.query()) as KeyResult[];
    },
    enabled: !!profile?.organization_id,
  });

  return { keyResults, isLoading };
}
