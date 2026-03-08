import { format, isPast, isToday } from "date-fns";
import { Calendar, User, Users, AlertCircle } from "lucide-react";
import { Task } from "@/hooks/useTasks";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onClick?: () => void;
  subtaskCount?: number;
  subtaskDoneCount?: number;
}

export function TaskItem({ task, onClick, subtaskCount = 0, subtaskDoneCount = 0 }: TaskItemProps) {
  const isOverdue = task.due_date && task.status !== "done" && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
  const isDueToday = task.due_date && isToday(new Date(task.due_date));

  return (
    <div
      className={cn(
        "p-3 border rounded-md bg-card hover:bg-accent/50 cursor-pointer transition-colors",
        isOverdue && "border-destructive/50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{task.title}</span>
            <TaskStatusBadge status={task.status} />
            {isOverdue && (
              <span className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                Overdue
              </span>
            )}
            {isDueToday && task.status !== "done" && (
              <span className="text-xs text-warning font-medium">Due today</span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            {task.assignee_user && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate">{task.assignee_user.name || task.assignee_user.email}</span>
              </div>
            )}
            {task.assignee_team && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span className="truncate">{task.assignee_team.name}</span>
              </div>
            )}
            {!task.assignee_user && !task.assignee_team && (
              <span className="text-muted-foreground/60">Unassigned</span>
            )}
            {task.due_date && (
              <div className={cn("flex items-center gap-1", isOverdue && "text-destructive")}>
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(task.due_date), "MMM d, yyyy")}</span>
              </div>
            )}
            {subtaskCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {subtaskDoneCount}/{subtaskCount} subtasks
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
