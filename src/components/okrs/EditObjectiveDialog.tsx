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
import { useObjectives, Objective } from "@/hooks/useOKRs";

interface EditObjectiveDialogProps {
  objective: Objective;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditObjectiveDialog({
  objective,
  open,
  onOpenChange,
}: EditObjectiveDialogProps) {
  const [title, setTitle] = useState(objective.title);
  const [description, setDescription] = useState(objective.description || "");
  const { updateObjective } = useObjectives();

  useEffect(() => {
    setTitle(objective.title);
    setDescription(objective.description || "");
  }, [objective]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await updateObjective.mutateAsync({
      id: objective.id,
      title: title.trim(),
      description: description.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Objective</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter objective title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description (optional)</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter objective description"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateObjective.isPending || !title.trim()}>
              {updateObjective.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
