import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc, API_URL } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface FileAttachment {
  id: string;
  organization_id: string;
  entity_type: "kr" | "initiative" | "task";
  entity_id: string;
  file_name: string;
  file_size: number;
  file_type: string | null;
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
}

export function useFileAttachments(entityType: "kr" | "initiative" | "task", entityId?: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ["file-attachments", entityType, entityId],
    queryFn: async () =>
      (await trpc.attachments.list.query({ entityType, entityId: entityId! })) as FileAttachment[],
    enabled: !!entityId && !!profile?.organization_id,
  });

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      if (!entityId) throw new Error("Missing context");
      // Proxied through the API (which streams to R2); credentials carry the
      // Better Auth session cookie.
      const form = new FormData();
      form.append("file", file);
      form.append("entityType", entityType);
      form.append("entityId", entityId);
      const res = await fetch(`${API_URL}/files/upload`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Upload failed (${res.status})`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file-attachments", entityType, entityId] });
      toast({ title: "File uploaded" });
    },
    onError: (err: Error) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteAttachment = useMutation({
    mutationFn: async (attachment: FileAttachment) => {
      await trpc.attachments.delete.mutate({ id: attachment.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file-attachments", entityType, entityId] });
      toast({ title: "File deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  // Short-lived presigned download URL for an attachment (by id).
  const getDownloadUrl = async (id: string) => {
    const { url } = await trpc.attachments.downloadUrl.query({ id });
    return url;
  };

  return { attachments, isLoading, uploadFile, deleteAttachment, getDownloadUrl };
}
