import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useInitiatives, InitiativeStatus } from "@/hooks/useInitiatives";
import { useOrgUsers } from "@/hooks/useOrgUsers";
import { useAllKeyResults, useObjectives } from "@/hooks/useOKRs";
import { KRMultiSelect } from "./KRMultiSelect";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

export function CreateInitiativeDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState<string>("none");
  const [status, setStatus] = useState<InitiativeStatus>("not_started");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [linkedKRs, setLinkedKRs] = useState<{ krId: string; weight?: number; autoLinked?: boolean }[]>([]);

  const { createInitiative } = useInitiatives();
  const { users } = useOrgUsers();
  const { keyResults } = useAllKeyResults();
  const { objectives } = useObjectives();

  const activeUsers = users.filter((u) => u.status === "active");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createInitiative.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      ownerId: ownerId === "none" ? undefined : ownerId,
      status,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      linkedKRs,
    });

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setOwnerId("none");
    setStatus("not_started");
    setStartDate("");
    setEndDate("");
    setLinkedKRs([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Initiative
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Initiative</DialogTitle>
            <DialogDescription>
              Add a new initiative and link it to Key Results.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="flex items-center">
                Title *
                <InfoTooltip>
                  What you're going to do. An Initiative is a project or workstream that moves
                  one or more Key Results. Example: "Launch referral program for existing buyers."
                </InfoTooltip>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Launch referral program for existing buyers"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="flex items-center">
                Description
                <InfoTooltip>
                  Optional scope, hypothesis, or context. Useful for teammates joining later.
                </InfoTooltip>
              </Label>
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
                <Label htmlFor="status" className="flex items-center">
                  Status
                  <InfoTooltip>
                    Not Started (planned, not begun), In Progress (actively being worked on),
                    Completed (done and shipped), Blocked (can't proceed until something else resolves).
                  </InfoTooltip>
                </Label>
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
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate" className="flex items-center">
                  Start Date
                  <InfoTooltip>
                    When work begins. Used in Timeline and Workload views.
                  </InfoTooltip>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate" className="flex items-center">
                  End Date
                  <InfoTooltip>
                    Target completion. Appears in Calendar and overdue lists.
                  </InfoTooltip>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center">
                Linked Key Results
                <InfoTooltip contentClassName="max-w-sm">
                  <p className="font-medium mb-1">Which KRs this Initiative moves.</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>One Initiative can move multiple KRs.</li>
                    <li>When you link a KR, this Initiative shows up on that KR's detail view.</li>
                    <li>Use weights (0–1) when one Initiative contributes more to one KR than another.</li>
                    <li>Weights default to equal if you don't set them.</li>
                  </ul>
                  <p className="mt-2 italic">
                    Example: A pricing page redesign might be weight 0.7 toward "Increase conversion"
                    and 0.3 toward "Reduce bounce rate".
                  </p>
                </InfoTooltip>
              </Label>
              <KRMultiSelect
                keyResults={keyResults}
                objectives={objectives}
                selectedKRs={linkedKRs}
                onChange={setLinkedKRs}
              />
              <p className="text-xs text-muted-foreground">
                Each link has an optional weight. Leave weights blank to distribute impact evenly across linked KRs.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || createInitiative.isPending}
            >
              {createInitiative.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
