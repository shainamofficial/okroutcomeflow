import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { InitiativeGantt } from "@/components/initiatives/InitiativeGantt";
import {
  Mail,
  Lock,
  Calendar,
  User,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

const emailSchema = z.string().trim().email().max(255);

type ViewState = "email-entry" | "loading" | "viewing" | "error";

interface SharedData {
  initiative: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
    owner: { id: string; name: string } | null;
  };
  tasks: {
    id: string;
    title: string;
    status: string;
    start_date: string | null;
    due_date: string | null;
    parent_task_id: string | null;
    color: string | null;
    assignee: { id: string; name: string } | null;
    assignee_team: { id: string; name: string } | null;
  }[];
  krLinks: {
    id: string;
    weight: number | null;
    key_result: { id: string; title: string; description: string | null; owner: { id: string; name: string } | null } | null;
    metrics: {
      metric_name: string;
      unit: string;
      direction: string;
      start_value: number;
      target_value: number;
      latest_value: { value: number; date: string } | null;
    }[];
  }[];
  updates: {
    id: string;
    content: string;
    update_kind: string;
    pinned: boolean;
    created_at: string;
    user: { id: string; name: string; avatar_url: string | null } | null;
  }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  not_started: { label: "Not Started", color: "bg-muted text-muted-foreground", icon: <Clock className="h-3.5 w-3.5" /> },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: <ArrowRight className="h-3.5 w-3.5" /> },
  completed: { label: "Completed", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  blocked: { label: "Blocked", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: <AlertCircle className="h-3.5 w-3.5" /> },
};




const UPDATE_KIND_LABELS: Record<string, string> = {
  comment: "Comment",
  progress: "Progress",
  blocker: "Blocker",
  decision: "Decision",
};

export default function SharedInitiative() {
  const { token } = useParams<{ token: string }>();
  const [viewState, setViewState] = useState<ViewState>("email-entry");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [data, setData] = useState<SharedData | null>(null);

  const handleSubmitEmail = async () => {
    setEmailError("");
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setViewState("loading");

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/get-shared-initiative`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email: result.data }),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        setErrorMessage(json.error || "Unable to access this initiative");
        setViewState("error");
        return;
      }

      setData(json);
      setViewState("viewing");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setViewState("error");
    }
  };

  if (viewState === "email-entry") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Access Initiative</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your email to verify access to this shared initiative.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitEmail()}
                    className="pl-9"
                  />
                </div>
              </div>
              {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            </div>
            <Button onClick={handleSubmitEmail} className="w-full">
              Verify Access
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewState === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (viewState === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-card">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-sm font-medium">{errorMessage}</p>
            <Button variant="outline" onClick={() => setViewState("email-entry")}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { initiative, tasks, krLinks, updates } = data;
  const status = STATUS_CONFIG[initiative.status] || STATUS_CONFIG.not_started;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const taskProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold tracking-tight">{initiative.title}</h1>
              <Badge className={`${status.color} shrink-0 flex items-center gap-1`}>
                {status.icon}
                {status.label}
              </Badge>
            </div>
            {initiative.description && (
              <p className="text-muted-foreground text-sm">{initiative.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {initiative.owner && (
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {initiative.owner.name}
                </span>
              )}
              {(initiative.start_date || initiative.end_date) && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {initiative.start_date && format(new Date(initiative.start_date), "MMM d, yyyy")}
                  {initiative.start_date && initiative.end_date && " – "}
                  {initiative.end_date && format(new Date(initiative.end_date), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Progress */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Task Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{doneTasks} of {totalTasks} tasks completed</span>
              <span className="font-medium">{taskProgress}%</span>
            </div>
            <Progress value={taskProgress} className="h-2" />
          </CardContent>
        </Card>

        {/* Tasks Gantt Timeline */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Tasks ({totalTasks})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalTasks === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
            ) : (
              <InitiativeGantt
                tasks={tasks.map((t) => ({
                  id: t.id,
                  title: t.title,
                  status: t.status,
                  start_date: t.start_date,
                  due_date: t.due_date,
                  parent_task_id: t.parent_task_id,
                  color: t.color,
                  assignee: t.assignee,
                  assignee_team: t.assignee_team,
                }))}
                initiativeStartDate={initiative.start_date}
                initiativeEndDate={initiative.end_date}
              />
            )}
          </CardContent>
        </Card>

        {/* Linked KRs */}
        {krLinks.length > 0 && (
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Linked Key Results ({krLinks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {krLinks.map((link) => {
                const kr = link.key_result;
                if (!kr) return null;
                const metric = link.metrics?.[0];
                let progress = 0;
                if (metric && metric.latest_value) {
                  const range = metric.target_value - metric.start_value;
                  if (range !== 0) {
                    progress = Math.min(
                      100,
                      Math.max(0, ((metric.latest_value.value - metric.start_value) / range) * 100)
                    );
                  }
                }
                return (
                  <div key={link.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium">{kr.title}</span>
                      {link.weight !== null && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          Weight: {link.weight}
                        </Badge>
                      )}
                    </div>
                    {metric && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {metric.metric_name}: {metric.latest_value?.value ?? metric.start_value} {metric.unit}
                          </span>
                          <span>Target: {metric.target_value} {metric.unit}</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Updates */}
        {updates.length > 0 && (
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Updates ({updates.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {updates.map((update) => (
                <div key={update.id} className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {update.user?.name || "Unknown"}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {UPDATE_KIND_LABELS[update.update_kind] || update.update_kind}
                    </Badge>
                    {update.pinned && (
                      <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        Pinned
                      </Badge>
                    )}
                    <span className="ml-auto">
                      {format(new Date(update.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{update.content}</p>
                  <Separator className="mt-3" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Shared view · Read only
          </p>
        </div>
      </div>
    </div>
  );
}
