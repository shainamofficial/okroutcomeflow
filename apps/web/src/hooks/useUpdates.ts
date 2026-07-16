import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      if (trpc) {
        return (await trpc.updates.list.query({ entityType, entityId })) as unknown as Update[];
      }
      const { data, error } = await supabase
        .from("updates")
        .select(`
          *,
          user:users_profile!updates_user_id_fkey(id, name, email, avatar_url),
          mentions:update_mentions(
            id,
            mentioned_user:users_profile!update_mentions_mentioned_user_id_fkey(id, name, email, avatar_url)
          ),
          reactions:update_reactions(
            id,
            user_id,
            reaction_type
          )
        `)
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Update[];
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

      if (trpc) {
        return await trpc.updates.create.mutate({
          entityType,
          entityId,
          updateKind,
          content,
          mentionedUserIds,
        });
      }

      // Create the update
      const { data: update, error: updateError } = await supabase
        .from("updates")
        .insert({
          organization_id: profile.organization_id,
          entity_type: entityType,
          entity_id: entityId,
          user_id: profile.id,
          update_kind: updateKind,
          content,
        })
        .select()
        .single();

      if (updateError) throw updateError;

      // Create mentions if any
      if (mentionedUserIds.length > 0) {
        const mentions = mentionedUserIds.map((userId) => ({
          update_id: update.id,
          mentioned_user_id: userId,
        }));

        const { error: mentionError } = await supabase
          .from("update_mentions")
          .insert(mentions);

        if (mentionError) throw mentionError;
      }

      return update;
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
      if (trpc) {
        await trpc.updates.togglePin.mutate({ updateId, pinned });
        return;
      }
      const { error } = await supabase
        .from("updates")
        .update({ pinned })
        .eq("id", updateId);

      if (error) throw error;
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
      if (trpc) {
        await trpc.updates.delete.mutate({ updateId });
        return;
      }
      const { error } = await supabase
        .from("updates")
        .delete()
        .eq("id", updateId);

      if (error) throw error;
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

      if (trpc) {
        await trpc.updates.toggleReaction.mutate({ updateId, reactionType });
        return;
      }

      // Check if reaction exists
      const { data: existing } = await supabase
        .from("update_reactions")
        .select("id")
        .eq("update_id", updateId)
        .eq("user_id", profile.id)
        .eq("reaction_type", reactionType)
        .maybeSingle();

      if (existing) {
        // Remove reaction
        const { error } = await supabase
          .from("update_reactions")
          .delete()
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from("update_reactions")
          .insert({
            update_id: updateId,
            user_id: profile.id,
            reaction_type: reactionType,
          });

        if (error) throw error;
      }
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
