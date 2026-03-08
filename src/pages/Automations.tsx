import { useState } from "react";
import { useAutomations } from "@/hooks/useAutomations";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Plus, Trash2, ArrowRight } from "lucide-react";

const TRIGGERS = [
  { value: "task_status_change", label: "When task status changes" },
  { value: "all_tasks_done", label: "When all tasks in initiative are done" },
  { value: "initiative_status_change", label: "When initiative status changes" },
  { value: "due_date_passed", label: "When due date passes" },
];

const ACTIONS = [
  { value: "change_initiative_status", label: "Change initiative status" },
  { value: "change_task_status", label: "Change task status" },
  { value: "send_notification", label: "Send notification" },
  { value: "create_update", label: "Create an update" },
];

export default function Automations() {
  const { automations, isLoading, createAutomation, toggleAutomation, deleteAutomation } = useAutomations();
  const { roles } = useAuth();
  const canManage = roles.includes("admin") || roles.includes("manager");

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("");
  const [action, setAction] = useState("");

  const handleCreate = () => {
    if (!name || !trigger || !action) return;
    createAutomation.mutate(
      { name, trigger_type: trigger, action_type: action },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setTrigger("");
          setAction("");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold font-display">Automations</h1>
          <p className="text-muted-foreground mt-1 text-sm hidden sm:block">Set up when-then rules to automate your workflow</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5">
                <Plus className="h-4 w-4" />
                New Automation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Automation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input placeholder="e.g. Auto-complete initiative" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>When (Trigger)</Label>
                  <Select value={trigger} onValueChange={setTrigger}>
                    <SelectTrigger><SelectValue placeholder="Select trigger..." /></SelectTrigger>
                    <SelectContent>
                      {TRIGGERS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Then (Action)</Label>
                  <Select value={action} onValueChange={setAction}>
                    <SelectTrigger><SelectValue placeholder="Select action..." /></SelectTrigger>
                    <SelectContent>
                      {ACTIONS.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} disabled={!name || !trigger || !action || createAutomation.isPending} className="w-full">
                  Create Automation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : automations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-accent-foreground" />
          </div>
          <h2 className="text-xl font-bold font-display">No automations yet</h2>
          <p className="text-muted-foreground mt-1 max-w-sm">
            Create rules to automate repetitive tasks and status changes.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {automations.map((auto) => {
            const triggerLabel = TRIGGERS.find((t) => t.value === auto.trigger_type)?.label || auto.trigger_type;
            const actionLabel = ACTIONS.find((a) => a.value === auto.action_type)?.label || auto.action_type;

            return (
              <Card key={auto.id} className="border-border/60">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <Zap className={`h-4 w-4 ${auto.enabled ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{auto.name}</span>
                      {!auto.enabled && <Badge variant="secondary" className="text-[10px]">Disabled</Badge>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                      <span>{triggerLabel}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>{actionLabel}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage && (
                      <>
                        <Switch
                          checked={auto.enabled}
                          onCheckedChange={(enabled) => toggleAutomation.mutate({ id: auto.id, enabled })}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteAutomation.mutate(auto.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
