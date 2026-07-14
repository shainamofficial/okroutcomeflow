import { Badge } from "@/components/ui/badge";
import { TaskStatus } from "@/hooks/useTasks";

const statusConfig: Record<TaskStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  todo: { label: "To Do", variant: "outline" },
  in_progress: { label: "In Progress", variant: "info" },
  blocked: { label: "Blocked", variant: "destructive" },
  done: { label: "Done", variant: "success" },
};

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
