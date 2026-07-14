import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { User, Calendar, Users, Eye, EyeOff } from "lucide-react";
import { Task } from "@/hooks/useTasks";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { ActivityFeed } from "@/components/updates/ActivityFeed";
import { FileAttachmentsPanel } from "@/components/files/FileAttachmentsPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useTaskWatchers } from "@/hooks/useTaskWatchers";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TaskDetailDrawerProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailDrawer({
  task,
  open,
  onOpenChange,
}: TaskDetailDrawerProps) {
  const { profile, roles } = useAuth();
  const { watchers, isWatching, toggleWatch } = useTaskWatchers(task.id);

  const isAdminOrManager = roles.includes("admin") || roles.includes("manager");
  const isAssignee = task.assignee_user_id === profile?.id;
  const canPostNonComment = isAdminOrManager || isAssignee;
  const canPin = isAdminOrManager || isAssignee;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 flex-wrap">
            {task.title}
            <TaskStatusBadge status={task.status} />
          </SheetTitle>
          {task.description && (
            <SheetDescription>{task.description}</SheetDescription>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Watchers */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => toggleWatch.mutate()}
            >
              {isWatching ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {isWatching ? "Unwatch" : "Watch"}
            </Button>
            {watchers.length > 0 && (
              <div className="flex -space-x-1.5">
                {watchers.slice(0, 5).map((w) => (
                  <Tooltip key={w.id}>
                    <TooltipTrigger>
                      <Avatar className="h-6 w-6 ring-2 ring-background">
                        <AvatarImage src={w.user?.avatar_url || undefined} />
                        <AvatarFallback className="text-[9px]">
                          {(w.user?.name || w.user?.email || "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>{w.user?.name || w.user?.email}</TooltipContent>
                  </Tooltip>
                ))}
                {watchers.length > 5 && (
                  <span className="text-xs text-muted-foreground ml-2">+{watchers.length - 5}</span>
                )}
              </div>
            )}
          </div>
        <div className="space-y-3">
            {task.assignee_user && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Assignee:</span>
                <span>{task.assignee_user.name || task.assignee_user.email}</span>
              </div>
            )}

            {task.assignee_team && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Team:</span>
                <span>{task.assignee_team.name}</span>
              </div>
            )}

            {(task.start_date || task.due_date) && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Dates:</span>
                <span>
                  {task.start_date &&
                    format(new Date(task.start_date), "MMM d, yyyy")}
                  {task.start_date && task.due_date && " - "}
                  {task.due_date &&
                    format(new Date(task.due_date), "MMM d, yyyy")}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Created:</span>
              <span>
                {format(new Date(task.created_at), "MMM d, yyyy")}
              </span>
            </div>
          </div>

          <Separator />

          <FileAttachmentsPanel entityType="task" entityId={task.id} />

          <Separator />

          <ActivityFeed
            entityType="task"
            entityId={task.id}
            canPostNonComment={canPostNonComment}
            canPin={canPin}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
