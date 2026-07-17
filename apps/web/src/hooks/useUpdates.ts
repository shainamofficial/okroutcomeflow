import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type EntityType = Database["public"]["Enums"]["entity_type"];
type UpdateKind = Database["public"]["Enums"]["update_kind"];

export interface UpdateUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface UpdateMention {
  id: string;
  mentioned_user: UpdateUser | null;
}

export interface UpdateReaction {
  id: string;
  user_id: string;
  reaction_type: string;
}

export interface Update {
  id: string;
  organization_id: string;
  entity_type: EntityType;
  entity_id: string;
  user_id: string;
  update_kind: UpdateKind;
  content: string;
  pinned: boolean;
  created_at: string;
  user: UpdateUser | null;
  mentions: UpdateMention[];
  reactions: UpdateReaction[];
}

export function useUpdates(entityType: EntityType, entityId: string) {
  return useQuery({
    queryKey: ["updates", entityType, entityId],
    queryFn: async () => {
      return (await trpc.updates.list.query({ entityType, entityId })) as unknown as Update[];
    },
    enabled: !!entityId,
  });
}

export function useCreateUpdate() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
      updateKind,
      content,
      mentionedUserIds,
    }: {
      entityType: EntityType;
      entityId: string;
      updateKind: UpdateKind;
      content: string;
      mentionedUserIds: string[];
    }) => {
      if (!profile?.organization_id) throw new Error("No organization");
      return await trpc.updates.create.mutate({
        entityType,
        entityId,
        updateKind,
        content,
        mentionedUserIds,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["updates", variables.entityType, variables.entityId],
      });
      toast.success("Update posted");
    },
    onError: (error) => {
      console.error("Failed to create update:", error);
      toast.error("Failed to post update");
    },
  });
}

export function useTogglePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      updateId,
      pinned,
      entityType,
      entityId,
    }: {
      updateId: string;
      pinned: boolean;
      entityType: EntityType;
      entityId: string;
    }) => {
      await trpc.updates.togglePin.mutate({ updateId, pinned });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["updates", variables.entityType, variables.entityId],
      });
      toast.success(variables.pinned ? "Update pinned" : "Update unpinned");
    },
    onError: (error) => {
      console.error("Failed to toggle pin:", error);
      toast.error("Failed to update pin status");
    },
  });
}

export function useDeleteUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      updateId,
      entityType,
      entityId,
    }: {
      updateId: string;
      entityType: EntityType;
      entityId: string;
    }) => {
      await trpc.updates.delete.mutate({ updateId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["updates", variables.entityType, variables.entityId],
      });
      toast.success("Update deleted");
    },
    onError: (error) => {
      console.error("Failed to delete update:", error);
      toast.error("Failed to delete update");
    },
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      updateId,
      reactionType,
      entityType,
      entityId,
    }: {
      updateId: string;
      reactionType: string;
      entityType: EntityType;
      entityId: string;
    }) => {
      if (!profile?.id) throw new Error("Not authenticated");
      await trpc.updates.toggleReaction.mutate({ updateId, reactionType });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["updates", variables.entityType, variables.entityId],
      });
    },
    onError: (error) => {
      console.error("Failed to toggle reaction:", error);
      toast.error("Failed to update reaction");
    },
  });
}
