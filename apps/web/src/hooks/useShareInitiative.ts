import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useShareLink(initiativeId: string) {
  const { profile } = useAuth();

  const { data: shareLink, isLoading } = useQuery({
    queryKey: ["share-link", initiativeId],
    queryFn: async () => trpc.initiativeShares.link.query({ initiativeId }),
    enabled: !!initiativeId && !!profile?.id,
  });

  return { shareLink, isLoading };
}

export function useShareViewers(shareLinkId?: string) {
  const { data: viewers = [], isLoading } = useQuery({
    queryKey: ["share-viewers", shareLinkId],
    queryFn: async () => {
      if (!shareLinkId) return [];
      return trpc.initiativeShares.viewers.query({ shareLinkId });
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
      return trpc.initiativeShares.createLink.mutate({ initiativeId });
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
      await trpc.initiativeShares.toggleLink.mutate({ id, isActive });
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
    mutationFn: async ({ shareLinkId, email }: { shareLinkId: string; email: string }) =>
      trpc.initiativeShares.addViewer.mutate({ shareLinkId, email: email.toLowerCase().trim() }),
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
      await trpc.initiativeShares.removeViewer.mutate({ id });
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
