import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("file_attachments")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FileAttachment[];
    },
    enabled: !!entityId && !!profile?.organization_id,
  });

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      if (!profile?.organization_id || !entityId) throw new Error("Missing context");

      const ext = file.name.split(".").pop();
      const storagePath = `${profile.organization_id}/${entityType}/${entityId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(storagePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("file_attachments").insert({
        organization_id: profile.organization_id,
        entity_type: entityType,
        entity_id: entityId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type || null,
        storage_path: storagePath,
        uploaded_by: profile.id,
      });
      if (dbError) throw dbError;
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
      await supabase.storage.from("attachments").remove([attachment.storage_path]);
      const { error } = await supabase.from("file_attachments").delete().eq("id", attachment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file-attachments", entityType, entityId] });
      toast({ title: "File deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const getDownloadUrl = async (storagePath: string) => {
    const { data } = await supabase.storage.from("attachments").createSignedUrl(storagePath, 3600);
    return data?.signedUrl;
  };

  return { attachments, isLoading, uploadFile, deleteAttachment, getDownloadUrl };
}
