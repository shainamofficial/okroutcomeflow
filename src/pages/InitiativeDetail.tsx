import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useInitiatives, useInitiativeKRLinks } from "@/hooks/useInitiatives";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import { useAllKeyResults, useObjectives } from "@/hooks/useOKRs";
import { getKRNestingLevel, getKRObjectiveId } from "@/lib/kr-hierarchy";
import { InitiativeGantt } from "@/components/initiatives/InitiativeGantt";
import { InitiativeStatusBadge } from "@/components/initiatives/InitiativeStatusBadge";
import { TaskList } from "@/components/tasks/TaskList";
import { ActivityFeed } from "@/components/updates/ActivityFeed";
import { FileAttachmentsPanel } from "@/components/files/FileAttachmentsPanel";
import { ShareInitiativeDialog } from "@/components/initiatives/ShareInitiativeDialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Share2,
  Target,
  User,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function InitiativeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { initiatives, isLoading: initLoading } = useInitiatives();
  const { tasks, isLoading: tasksLoading } = useTasks(id);
  const { links, isLoading: linksLoading } = useInitiativeKRLinks(id);
  const { profile, roles } = useAuth();
  const { keyResults } = useAllKeyResults();
  const { objectives } = useObjectives();
  const [shareOpen, setShareOpen] = useState(false);

  const initiative = initiatives.find((i) => i.id === id);

  const canManage = roles.includes("admin") || roles.includes("manager");
  const isOwner = initiative?.owner_id === profile?.id;
  const canShare = canManage || isOwner;
  const canPostNonComment = canManage || isOwner;
  const canPin = canManage || isOwner;

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const taskProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const sortedLinks = useMemo(() => {
    return [...links].sort((a, b) => {
      const levelA = getKRNestingLevel(a.key_result_id, keyResults);
      const levelB = getKRNestingLevel(b.key_result_id, keyResults);
      return levelA - levelB;
    });
  }, [links, keyResults]);

  const getObjectiveTitle = (krId: string) => {
    const objId = getKRObjectiveId(krId, keyResults);
    if (!objId) return null;
    return objectives.find((o) => o.id === objId)?.title;
  };

  if (initLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!initiative) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-muted-foreground">Initiative not found.</p>
        <Button variant="outline" onClick={() => navigate("/app/initiatives")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Initiatives
        </Button>
      </div>
    );
  }

  // Map tasks for the Gantt component
  const ganttTasks = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    start_date: t.start_date,
    due_date: t.due_date,
    parent_task_id: t.parent_task_id,
    color: t.color,
    assignee: t.assignee_user ? { id: t.assignee_user.id, name: t.assignee_user.name } : null,
    assignee_team: t.assignee_team ? { id: t.assignee_team.id, name: t.assignee_team.name } : null,
  }));

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" className="mt-1 shrink-0" onClick={() => navigate("/app/initiatives")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{initiative.title}</h1>
            <InitiativeStatusBadge status={initiative.status} />
            {canShare && (
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => setShareOpen(true)}>
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                Share
              </Button>
            )}
          </div>
          {initiative.description && (
            <p className="text-sm text-muted-foreground">{initiative.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {initiative.owner && (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {initiative.owner.name || initiative.owner.email}
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

      {/* Task Progress */}
      {totalTasks > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Task Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {doneTasks} of {totalTasks} tasks completed
              </span>
              <span className="font-medium">{taskProgress}%</span>
            </div>
            <Progress value={taskProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Gantt Timeline */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <InitiativeGantt
              tasks={ganttTasks}
              initiativeStartDate={initiative.start_date}
              initiativeEndDate={initiative.end_date}
            />
          )}
        </CardContent>
      </Card>

      {/* Linked Key Results */}
      {!linksLoading && sortedLinks.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Linked Key Results ({links.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sortedLinks.map((link) => {
              const level = getKRNestingLevel(link.key_result_id, keyResults);
              const isAutoLinked =
                link.weight === null &&
                level < Math.max(...sortedLinks.map((l) => getKRNestingLevel(l.key_result_id, keyResults)));
              const objectiveTitle = level === 0 ? getObjectiveTitle(link.key_result_id) : null;

              return (
                <div key={link.id}>
                  {level === 0 && objectiveTitle && (
                    <p className="text-xs text-muted-foreground mb-1 mt-2 first:mt-0">{objectiveTitle}</p>
                  )}
                  <div
                    className={cn(
                      "p-3 border rounded-md",
                      isAutoLinked ? "bg-muted/20 border-dashed" : "bg-muted/30"
                    )}
                    style={{ marginLeft: `${level * 12}px` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isAutoLinked && <LinkIcon className="h-3 w-3 text-muted-foreground shrink-0" />}
                        <span className="text-sm font-medium">{link.key_result?.title}</span>
                      </div>
                      {link.weight !== null && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          Weight: {link.weight}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Tasks */}
      <TaskList
        initiativeId={initiative.id}
        initiativeOwnerId={initiative.owner_id}
        canManage={canManage}
      />

      <Separator />

      {/* Files */}
      <FileAttachmentsPanel entityType="initiative" entityId={initiative.id} />

      <Separator />

      {/* Activity */}
      <ActivityFeed
        entityType="initiative"
        entityId={initiative.id}
        canPostNonComment={canPostNonComment}
        canPin={canPin}
      />

      {/* Share Dialog */}
      <ShareInitiativeDialog
        initiativeId={initiative.id}
        initiativeTitle={initiative.title}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </div>
  );
}
