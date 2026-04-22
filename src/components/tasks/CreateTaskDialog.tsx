import { useState } from "react";
import { Plus } from "lucide-react";
import { format } from "date-fns";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks, TaskStatus } from "@/hooks/useTasks";
import { AssigneeSelector, AssigneeType } from "./AssigneeSelector";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

interface CreateTaskDialogProps {
  initiativeId: string;
}

export function CreateTaskDialog({ initiativeId }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [assigneeType, setAssigneeType] = useState<AssigneeType>(null);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [dueDate, setDueDate] = useState<Date | undefined>();

  const { createTask } = useTasks(initiativeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask.mutate(
      {
        initiativeId,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        assigneeUserId: assigneeType === "user" ? assigneeId || undefined : undefined,
        assigneeTeamId: assigneeType === "team" ? assigneeId || undefined : undefined,
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setAssigneeType(null);
    setAssigneeId(null);
    setStartDate(undefined);
    setDueDate(undefined);
  };

  const handleAssigneeChange = (type: AssigneeType, id: string | null) => {
    setAssigneeType(type);
    setAssigneeId(id);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Add a new task to this initiative.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center">
                Title *
                <InfoTooltip>
                  A concrete, actionable work item. Start with a verb. Example: 'Draft referral email copy.'
                </InfoTooltip>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Draft referral email copy"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center">
                Description
                <InfoTooltip>
                  Optional details, context, or acceptance criteria.
                </InfoTooltip>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Task description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center">
                Assignee
                <InfoTooltip>
                  One person responsible for completing this task. Different from the initiative owner.
                </InfoTooltip>
              </Label>
              <AssigneeSelector
                assigneeType={assigneeType}
                assigneeId={assigneeId}
                onAssigneeChange={handleAssigneeChange}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center">
                Status
                <InfoTooltip>
                  Todo (not started), In Progress (being worked on), Blocked (stuck), Done (completed).
                </InfoTooltip>
              </Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center">
                  Start Date
                  <InfoTooltip>
                    When work on this task is expected to begin.
                  </InfoTooltip>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center">
                  Due Date
                  <InfoTooltip>
                    When this task must be complete. Appears in Calendar and drives 'overdue' flags.
                  </InfoTooltip>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      disabled={(date) => startDate ? date < startDate : false}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || createTask.isPending}>
              {createTask.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
