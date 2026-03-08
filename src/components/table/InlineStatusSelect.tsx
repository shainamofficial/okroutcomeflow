import { TaskStatus } from "@/hooks/useTasks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";

interface InlineStatusSelectProps {
  status: TaskStatus;
  onStatusChange: (status: TaskStatus) => void;
}

export function InlineStatusSelect({ status, onStatusChange }: InlineStatusSelectProps) {
  return (
    <Select value={status} onValueChange={(v) => onStatusChange(v as TaskStatus)}>
      <SelectTrigger className="h-7 w-[120px] border-none bg-transparent hover:bg-accent/50 px-1 text-xs focus:ring-0 focus:ring-offset-0">
        <SelectValue>
          <TaskStatusBadge status={status} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todo">To Do</SelectItem>
        <SelectItem value="in_progress">In Progress</SelectItem>
        <SelectItem value="blocked">Blocked</SelectItem>
        <SelectItem value="done">Done</SelectItem>
      </SelectContent>
    </Select>
  );
}
