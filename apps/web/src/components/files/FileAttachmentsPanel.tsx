import { useRef } from "react";
import { Paperclip, Download, Trash2, FileText, Image, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFileAttachments, FileAttachment } from "@/hooks/useFileAttachments";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface FileAttachmentsProps {
  entityType: "kr" | "initiative" | "task";
  entityId: string;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string | null) {
  if (type?.startsWith("image/")) return Image;
  if (type?.includes("pdf") || type?.includes("document")) return FileText;
  return File;
}

export function FileAttachmentsPanel({ entityType, entityId }: FileAttachmentsProps) {
  const { attachments, isLoading, uploadFile, deleteAttachment, getDownloadUrl } = useFileAttachments(entityType, entityId);
  const { profile, roles } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUpload = !!profile;
  const canDelete = (att: FileAttachment) =>
    att.uploaded_by === profile?.id || roles.includes("admin") || roles.includes("manager");

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        return; // skip files > 20MB
      }
      uploadFile.mutate(file);
    });
    e.target.value = "";
  };

  const handleDownload = async (att: FileAttachment) => {
    const url = await getDownloadUrl(att.id);
    if (url) window.open(url, "_blank");
  };

  if (isLoading) {
    return <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          <h3 className="font-medium text-sm">Files ({attachments.length})</h3>
        </div>
        {canUpload && (
          <>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadFile.isPending}
            >
              <Paperclip className="h-3 w-3 mr-1" />
              {uploadFile.isPending ? "Uploading..." : "Attach"}
            </Button>
          </>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">No files attached yet.</p>
      ) : (
        <div className="space-y-1.5">
          {attachments.map((att) => {
            const Icon = getFileIcon(att.file_type);
            return (
              <div
                key={att.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors group"
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{att.file_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(att.file_size)} · {formatDistanceToNow(new Date(att.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDownload(att)}>
                    <Download className="h-3 w-3" />
                  </Button>
                  {canDelete(att) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => deleteAttachment.mutate(att)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
