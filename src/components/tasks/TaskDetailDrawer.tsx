import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { User, Calendar, Users } from "lucide-react";
import { Task } from "@/hooks/useTasks";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { ActivityFeed } from "@/components/updates/ActivityFeed";
import { FileAttachmentsPanel } from "@/components/files/FileAttachmentsPanel";
import { useAuth } from "@/contexts/AuthContext";

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

  const isAdminOrManager = roles.includes("admin") || roles.includes("manager");
  const isAssignee = task.assignee_user_id === profile?.id;
  
  // Can post non-comment updates if admin, manager, or task assignee
  const canPostNonComment = isAdminOrManager || isAssignee;
  // Can pin if admin, manager, or task assignee
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
