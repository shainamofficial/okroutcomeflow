import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKeyResults, KeyResult } from "@/hooks/useOKRs";
import { useOrgUsers } from "@/hooks/useOrgUsers";
import { useAuth } from "@/contexts/AuthContext";

interface EditKeyResultDialogProps {
  keyResult: KeyResult;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditKeyResultDialog({
  keyResult,
  open,
  onOpenChange,
}: EditKeyResultDialogProps) {
  const [title, setTitle] = useState(keyResult.title);
  const [description, setDescription] = useState(keyResult.description || "");
  const [ownerId, setOwnerId] = useState<string>(keyResult.owner_id || "");
  const { updateKeyResult } = useKeyResults();
  const { users } = useOrgUsers();
  const { roles } = useAuth();

  const activeUsers = users.filter((u) => u.status === "active");
  const canChangeOwner = roles.includes("admin") || roles.includes("manager");

  useEffect(() => {
    setTitle(keyResult.title);
    setDescription(keyResult.description || "");
    setOwnerId(keyResult.owner_id || "");
  }, [keyResult]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await updateKeyResult.mutateAsync({
      id: keyResult.id,
      title: title.trim(),
      description: description.trim(),
      ownerId: ownerId || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Key Result</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-kr-title">Title</Label>
            <Input
              id="edit-kr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter key result title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-kr-description">Description (optional)</Label>
            <Textarea
              id="edit-kr-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter key result description"
              rows={3}
            />
          </div>
          {canChangeOwner && (
            <div className="space-y-2">
              <Label htmlFor="edit-kr-owner">Owner (optional)</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No owner</SelectItem>
                  {activeUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateKeyResult.isPending || !title.trim()}>
              {updateKeyResult.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
