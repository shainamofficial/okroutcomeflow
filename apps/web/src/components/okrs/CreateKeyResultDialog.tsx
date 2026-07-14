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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GitBranch } from "lucide-react";
import { useKeyResults } from "@/hooks/useOKRs";
import { useOrgUsers } from "@/hooks/useOrgUsers";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

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
  const [ownerId, setOwnerId] = useState<string>("none");
  const { createKeyResult } = useKeyResults();
  const { users } = useOrgUsers();

  const isSubKR = Boolean(parentKrId);
  const activeUsers = users.filter((u) => u.status === "active");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createKeyResult.mutateAsync({
      title: title.trim(),
      description: description.trim(),
      objectiveId,
      parentKrId,
      ownerId: ownerId === "none" ? undefined : ownerId,
    });
    setTitle("");
    setDescription("");
    setOwnerId("none");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isSubKR ? "Add Sub Key Result" : "Add Key Result"}
          </DialogTitle>
          <DialogDescription>
            {isSubKR
              ? "A team-level contribution that rolls up to the parent KR."
              : "A measurable outcome that proves the objective is being met. Aim for 3–5 per objective."}
          </DialogDescription>
        </DialogHeader>
        {isSubKR && (
          <Alert>
            <GitBranch className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Sub-KR:</strong> Use this to break a team-level KR into contributions from different teams or workstreams. The parent's progress can be computed from its sub-KRs.
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kr-title" className="flex items-center">
              Title
              <InfoTooltip>
                <div className="space-y-2">
                  <p>
                    Start with a <strong>verb</strong>, end with a <strong>number</strong>. Describe an outcome, not an activity.
                  </p>
                  <div>
                    <p className="font-medium text-emerald-600 dark:text-emerald-400">Good</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>Grow monthly active buyers from 200 to 500</li>
                      <li>Reduce checkout drop-off from 38% to 20%</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-destructive">Avoid</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>"Launch new checkout" — that's an initiative</li>
                      <li>"Improve buyer growth" — not measurable</li>
                    </ul>
                  </div>
                </div>
              </InfoTooltip>
            </Label>
            <Input
              id="kr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Grow monthly active buyers from 200 to 500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kr-description" className="flex items-center">
              Description (optional)
              <InfoTooltip>
                Optional context — how the number is defined, where it's measured, any caveats. Useful when someone new inherits this KR.
              </InfoTooltip>
            </Label>
            <Textarea
              id="kr-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="How is this measured? Any caveats?"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kr-owner" className="flex items-center">
              Owner (optional)
              <InfoTooltip>
                One person accountable for this KR. They don't need to do all the work — they're the single point of contact and the one who reports progress in reviews.
              </InfoTooltip>
            </Label>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No owner</SelectItem>
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
