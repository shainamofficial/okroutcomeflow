import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Initiative,
  InitiativeStatus,
  useInitiatives,
  useInitiativeKRLinks,
} from "@/hooks/useInitiatives";
import { useOrgUsers } from "@/hooks/useOrgUsers";
import { useAllKeyResults, useObjectives } from "@/hooks/useOKRs";
import { KRMultiSelect } from "./KRMultiSelect";

interface EditInitiativeDialogProps {
  initiative: Initiative;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditInitiativeDialog({
  initiative,
  open,
  onOpenChange,
}: EditInitiativeDialogProps) {
  const [title, setTitle] = useState(initiative.title);
  const [description, setDescription] = useState(initiative.description || "");
  const [ownerId, setOwnerId] = useState<string>(initiative.owner_id || "none");
  const [status, setStatus] = useState<InitiativeStatus>(initiative.status);
  const [startDate, setStartDate] = useState(initiative.start_date || "");
  const [endDate, setEndDate] = useState(initiative.end_date || "");
  const [linkedKRs, setLinkedKRs] = useState<{ krId: string; weight?: number; autoLinked?: boolean }[]>([]);

  const { updateInitiative } = useInitiatives();
  const { users } = useOrgUsers();
  const { keyResults } = useAllKeyResults();
  const { objectives } = useObjectives();
  const { links } = useInitiativeKRLinks(initiative.id);

  const activeUsers = users.filter((u) => u.status === "active");

  useEffect(() => {
    setTitle(initiative.title);
    setDescription(initiative.description || "");
    setOwnerId(initiative.owner_id || "none");
    setStatus(initiative.status);
    setStartDate(initiative.start_date || "");
    setEndDate(initiative.end_date || "");
  }, [initiative]);

  useEffect(() => {
    if (links.length > 0) {
      setLinkedKRs(
        links.map((link) => ({
          krId: link.key_result_id,
          weight: link.weight ?? undefined,
        }))
      );
    }
  }, [links]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await updateInitiative.mutateAsync({
      id: initiative.id,
      title: title.trim(),
      description: description.trim() || undefined,
      ownerId: ownerId === "none" ? undefined : ownerId,
      status,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      linkedKRs,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Initiative</DialogTitle>
            <DialogDescription>
              Update the initiative details and linked Key Results.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter initiative title"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="owner">Owner</Label>
                <Select value={ownerId} onValueChange={setOwnerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
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

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as InitiativeStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Linked Key Results</Label>
              <KRMultiSelect
                keyResults={keyResults}
                objectives={objectives}
                selectedKRs={linkedKRs}
                onChange={setLinkedKRs}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || updateInitiative.isPending}
            >
              {updateInitiative.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
