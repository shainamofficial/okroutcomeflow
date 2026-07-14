import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useObjectives } from "@/hooks/useOKRs";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

export function CreateObjectiveDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { createObjective } = useObjectives();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createObjective.mutateAsync({ title: title.trim(), description: description.trim() });
    setTitle("");
    setDescription("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Objective
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Objective</DialogTitle>
          <DialogDescription>
            A qualitative, inspirational statement of what you want to achieve this cycle. You'll add measurable Key Results under it in the next step.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center">
              Title
              <InfoTooltip>
                <div className="space-y-2">
                  <p>
                    Good Objectives are <strong>qualitative, ambitious, time-bound, and meaningful</strong> — they describe a destination, not a metric.
                  </p>
                  <div>
                    <p className="font-medium">Examples</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>Become the preferred marketplace for US jewelers</li>
                      <li>Delight customers with a world-class checkout</li>
                    </ul>
                  </div>
                </div>
              </InfoTooltip>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Become the preferred marketplace for US jewelers"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center">
              Description (optional)
              <InfoTooltip>
                Why does this matter? Add context so future readers (and your future self) understand the "why" behind this Objective.
              </InfoTooltip>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this objective matters and who it's for"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createObjective.isPending || !title.trim()}>
              {createObjective.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
