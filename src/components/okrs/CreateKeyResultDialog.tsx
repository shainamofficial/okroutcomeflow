import { useState } from "react";
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
import { useKeyResults } from "@/hooks/useOKRs";
import { useOrgUsers } from "@/hooks/useOrgUsers";

interface CreateKeyResultDialogProps {
  objectiveId?: string;
  parentKrId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateKeyResultDialog({
  objectiveId,
  parentKrId,
  open,
  onOpenChange,
}: CreateKeyResultDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState<string>("");
  const { createKeyResult } = useKeyResults();
  const { users } = useOrgUsers();

  const activeUsers = users.filter((u) => u.status === "active");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createKeyResult.mutateAsync({
      title: title.trim(),
      description: description.trim(),
      objectiveId,
      parentKrId,
      ownerId: ownerId || undefined,
    });
    setTitle("");
    setDescription("");
    setOwnerId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {parentKrId ? "Add Sub Key Result" : "Add Key Result"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kr-title">Title</Label>
            <Input
              id="kr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter key result title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kr-description">Description (optional)</Label>
            <Textarea
              id="kr-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter key result description"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kr-owner">Owner (optional)</Label>
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createKeyResult.isPending || !title.trim()}>
              {createKeyResult.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
