import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Copy, Link, Mail, Plus, Trash2, Check } from "lucide-react";
import {
  useShareLink,
  useShareViewers,
  useCreateShareLink,
  useToggleShareLink,
  useAddShareViewer,
  useRemoveShareViewer,
} from "@/hooks/useShareInitiative";
import { z } from "zod";

const emailSchema = z.string().trim().email().max(255);

interface ShareInitiativeDialogProps {
  initiativeId: string;
  initiativeTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareInitiativeDialog({
  initiativeId,
  initiativeTitle,
  open,
  onOpenChange,
}: ShareInitiativeDialogProps) {
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [copied, setCopied] = useState(false);

  const { shareLink, isLoading } = useShareLink(initiativeId);
  const { viewers } = useShareViewers(shareLink?.id);
  const createShareLink = useCreateShareLink();
  const toggleShareLink = useToggleShareLink();
  const addViewer = useAddShareViewer();
  const removeViewer = useRemoveShareViewer();

  const shareUrl = shareLink
    ? `${window.location.origin}/share/initiative/${shareLink.token}`
    : "";

  const handleCreateLink = () => {
    createShareLink.mutate(initiativeId);
  };

  const handleToggleActive = (checked: boolean) => {
    if (shareLink) {
      toggleShareLink.mutate({
        id: shareLink.id,
        isActive: checked,
        initiativeId,
      });
    }
  };

  const handleAddEmail = () => {
    setEmailError("");
    const result = emailSchema.safeParse(newEmail);
    if (!result.success) {
      setEmailError("Please enter a valid email address");
      return;
    }
    if (viewers.some((v) => v.email === result.data.toLowerCase())) {
      setEmailError("This email is already added");
      return;
    }
    if (!shareLink) return;
    addViewer.mutate(
      { shareLinkId: shareLink.id, email: result.data },
      { onSuccess: () => setNewEmail("") }
    );
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Share Initiative
          </DialogTitle>
          <DialogDescription>
            Share a read-only view of "{initiativeTitle}" with specific people.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !shareLink ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                No share link exists yet. Create one to share this initiative.
              </p>
              <Button
                onClick={handleCreateLink}
                disabled={createShareLink.isPending}
              >
                <Link className="h-4 w-4 mr-2" />
                Generate Share Link
              </Button>
            </div>
          ) : (
            <>
              {/* Link & Active Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Link Active</Label>
                  <Switch
                    checked={shareLink.is_active}
                    onCheckedChange={handleToggleActive}
                  />
                </div>

                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="text-xs font-mono"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {!shareLink.is_active && (
                  <p className="text-xs text-muted-foreground">
                    This link is currently deactivated. Viewers cannot access it.
                  </p>
                )}
              </div>

              <Separator />

              {/* Add Viewers */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Allowed Viewers ({viewers.length})
                </Label>

                <div className="flex gap-2">
                  <Input
                    placeholder="email@example.com"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      setEmailError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                    className="text-sm"
                  />
                  <Button
                    size="icon"
                    onClick={handleAddEmail}
                    disabled={addViewer.isPending || !newEmail}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {emailError && (
                  <p className="text-xs text-destructive">{emailError}</p>
                )}

                {viewers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Add email addresses of people who should access this link.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {viewers.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-1.5"
                      >
                        <Badge variant="secondary" className="text-xs font-normal">
                          {v.email}
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() =>
                            removeViewer.mutate({
                              id: v.id,
                              shareLinkId: shareLink.id,
                            })
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
