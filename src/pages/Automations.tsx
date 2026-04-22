import { useState } from "react";
import { useAutomations } from "@/hooks/useAutomations";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Zap, Plus, Trash2, ArrowRight } from "lucide-react";

type ConfigField = {
  label: string;
  options?: string[];
  type?: "select" | "textarea";
  required?: boolean;
};

type ConfigSchema = Record<string, ConfigField>;

const TRIGGERS: { value: string; label: string; config: ConfigSchema }[] = [
  {
    value: "task_status_change",
    label: "When task status changes",
    config: {
      to_status: {
        label: "When status changes to",
        options: ["todo", "in_progress", "blocked", "done"],
        required: true,
      },
    },
  },
  {
    value: "all_tasks_done",
    label: "When all tasks in initiative are done",
    config: {},
  },
  {
    value: "initiative_status_change",
    label: "When initiative status changes",
    config: {
      to_status: {
        label: "When status changes to",
        options: ["not_started", "in_progress", "completed", "blocked"],
        required: true,
      },
    },
  },
  {
    value: "due_date_passed",
    label: "When due date passes",
    config: {
      object_type: {
        label: "Applies to",
        options: ["task", "initiative"],
        required: true,
      },
    },
  },
];

const ACTIONS: { value: string; label: string; config: ConfigSchema }[] = [
  {
    value: "change_initiative_status",
    label: "Change initiative status",
    config: {
      to_status: {
        label: "Change initiative status to",
        options: ["not_started", "in_progress", "completed", "blocked"],
        required: true,
      },
    },
  },
  {
    value: "change_task_status",
    label: "Change task status",
    config: {
      to_status: {
        label: "Change task status to",
        options: ["todo", "in_progress", "blocked", "done"],
        required: true,
      },
    },
  },
  {
    value: "send_notification",
    label: "Send notification",
    config: {
      recipient: {
        label: "Notify",
        options: ["initiative_owner", "task_assignee", "all_admins"],
        required: true,
      },
      message: {
        label: "Message",
        type: "textarea",
        required: false,
      },
    },
  },
  {
    value: "create_update",
    label: "Create an update",
    config: {
      content: {
        label: "Update content",
        type: "textarea",
        required: true,
      },
    },
  },
];

export default function Automations() {
  const { automations, isLoading, createAutomation, toggleAutomation, deleteAutomation } = useAutomations();
  const { roles } = useAuth();
  const canManage = roles.includes("admin") || roles.includes("manager");

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("");
  const [action, setAction] = useState("");
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>({});
  const [actionConfig, setActionConfig] = useState<Record<string, any>>({});

  const triggerDef = TRIGGERS.find((t) => t.value === trigger);
  const actionDef = ACTIONS.find((a) => a.value === action);

  const handleTriggerChange = (value: string) => {
    setTrigger(value);
    setTriggerConfig({});
  };

  const handleActionChange = (value: string) => {
    setAction(value);
    setActionConfig({});
  };

  const isConfigComplete = () => {
    if (triggerDef) {
      for (const [key, field] of Object.entries(triggerDef.config)) {
        if (field.required && !triggerConfig[key]) return false;
      }
    }
    if (actionDef) {
      for (const [key, field] of Object.entries(actionDef.config)) {
        if (field.required && !actionConfig[key]) return false;
      }
    }
    return true;
  };

  const renderConfigFields = (
    schema: ConfigSchema,
    value: Record<string, any>,
    onChange: (next: Record<string, any>) => void,
  ) => {
    return Object.entries(schema).map(([key, field]) => (
      <div key={key} className="space-y-1.5">
        <Label className="text-xs">
          {field.label}
          {field.required === false && <span className="text-muted-foreground ml-1">(optional)</span>}
        </Label>
        {field.type === "textarea" ? (
          <Textarea
            value={value[key] || ""}
            onChange={(e) => onChange({ ...value, [key]: e.target.value })}
            placeholder="Type here…"
            rows={3}
          />
        ) : (
          <Select value={value[key] || ""} onValueChange={(v) => onChange({ ...value, [key]: v })}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    ));
  };

  const handleCreate = () => {
    if (!name || !trigger || !action || !isConfigComplete()) return;
    createAutomation.mutate(
      {
        name,
        trigger_type: trigger,
        trigger_config: triggerConfig,
        action_type: action,
        action_config: actionConfig,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setTrigger("");
          setAction("");
          setTriggerConfig({});
          setActionConfig({});
        },
      }
    );
  };

  const triggerHasConfig = triggerDef && Object.keys(triggerDef.config).length > 0;
  const actionHasConfig = actionDef && Object.keys(actionDef.config).length > 0;

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
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Automation</DialogTitle>
                <DialogDescription>
                  Build a when-then rule. OKRoutcomeFlow will run it automatically whenever the trigger event happens.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input placeholder="e.g. Auto-complete initiative" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center">
                    When (Trigger)
                    <InfoTooltip>The event that starts this automation.</InfoTooltip>
                  </Label>
                  <Select value={trigger} onValueChange={handleTriggerChange}>
                    <SelectTrigger><SelectValue placeholder="Select trigger..." /></SelectTrigger>
                    <SelectContent>
                      {TRIGGERS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {triggerHasConfig && (
                    <div className="rounded-md border bg-muted/30 p-3 space-y-3">
                      <div className="text-xs font-medium text-muted-foreground">Trigger details</div>
                      {renderConfigFields(triggerDef!.config, triggerConfig, setTriggerConfig)}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center">
                    Then (Action)
                    <InfoTooltip>What OKRoutcomeFlow does when the trigger fires.</InfoTooltip>
                  </Label>
                  <Select value={action} onValueChange={handleActionChange}>
                    <SelectTrigger><SelectValue placeholder="Select action..." /></SelectTrigger>
                    <SelectContent>
                      {ACTIONS.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {actionHasConfig && (
                    <div className="rounded-md border bg-muted/30 p-3 space-y-3">
                      <div className="text-xs font-medium text-muted-foreground">Action details</div>
                      {renderConfigFields(actionDef!.config, actionConfig, setActionConfig)}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={!name || !trigger || !action || !isConfigComplete() || createAutomation.isPending}
                  className="w-full"
                >
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
