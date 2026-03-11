import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useShareLink(initiativeId: string) {
  const { profile } = useAuth();

  const { data: shareLink, isLoading } = useQuery({
    queryKey: ["share-link", initiativeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiative_share_links")
        .select("*")
        .eq("initiative_id", initiativeId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!initiativeId && !!profile?.id,
  });

  return { shareLink, isLoading };
}

export function useShareViewers(shareLinkId?: string) {
  const { data: viewers = [], isLoading } = useQuery({
    queryKey: ["share-viewers", shareLinkId],
    queryFn: async () => {
      if (!shareLinkId) return [];
      const { data, error } = await supabase
        .from("initiative_share_viewers")
        .select("*")
        .eq("share_link_id", shareLinkId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!shareLinkId,
  });

  return { viewers, isLoading };
}

export function useCreateShareLink() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (initiativeId: string) => {
      if (!profile?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("initiative_share_links")
        .insert({
          initiative_id: initiativeId,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, initiativeId) => {
      queryClient.invalidateQueries({ queryKey: ["share-link", initiativeId] });
      toast({ title: "Share link created" });
    },
    onError: (error) => {
      toast({ title: "Failed to create share link", description: error.message, variant: "destructive" });
    },
  });
}

export function useToggleShareLink() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, isActive, initiativeId }: { id: string; isActive: boolean; initiativeId: string }) => {
      const { error } = await supabase
        .from("initiative_share_links")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
      return initiativeId;
    },
    onSuccess: (initiativeId) => {
      queryClient.invalidateQueries({ queryKey: ["share-link", initiativeId] });
      toast({ title: "Share link updated" });
    },
    onError: (error) => {
      toast({ title: "Failed to update share link", description: error.message, variant: "destructive" });
    },
  });
}

export function useAddShareViewer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ shareLinkId, email }: { shareLinkId: string; email: string }) => {
      const { data, error } = await supabase
        .from("initiative_share_viewers")
        .insert({
          share_link_id: shareLinkId,
          email: email.toLowerCase().trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["share-viewers", data.share_link_id] });
      toast({ title: "Viewer added" });
    },
    onError: (error) => {
      toast({ title: "Failed to add viewer", description: error.message, variant: "destructive" });
    },
  });
}

export function useRemoveShareViewer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, shareLinkId }: { id: string; shareLinkId: string }) => {
      const { error } = await supabase
        .from("initiative_share_viewers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return shareLinkId;
    },
    onSuccess: (shareLinkId) => {
      queryClient.invalidateQueries({ queryKey: ["share-viewers", shareLinkId] });
      toast({ title: "Viewer removed" });
    },
    onError: (error) => {
      toast({ title: "Failed to remove viewer", description: error.message, variant: "destructive" });
    },
  });
}
