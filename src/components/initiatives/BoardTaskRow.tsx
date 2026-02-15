import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Task, TaskStatus } from "@/hooks/useTasks";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const TASK_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "Todo" },
  { status: "in_progress", label: "In Progress" },
  { status: "blocked", label: "Blocked" },
  { status: "done", label: "Done" },
];

interface BoardTaskRowProps {
  initiativeId: string;
}

export function BoardTaskRow({ initiativeId }: BoardTaskRowProps) {
  const { tasks, updateTask } = useTasks(initiativeId);
  const { roles } = useAuth();
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  const canManage = roles.includes("admin") || roles.includes("manager") || roles.includes("contributor");

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.stopPropagation();
    e.dataTransfer.setData("task-id", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData("task-id");
    if (taskId) {
      updateTask.mutate({ id: taskId, status });
    }
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCol(status);
  };

  if (tasks.length === 0) {
    return <p className="text-xs text-muted-foreground px-2 pb-2">No tasks yet.</p>;
  }

  return (
    <div className="grid grid-cols-4 gap-1.5 px-2 pb-2">
      {TASK_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        return (
          <div
            key={col.status}
            className={cn(
              "rounded-md bg-muted/50 p-1.5 min-h-[40px] transition-colors",
              dragOverCol === col.status && "ring-2 ring-primary/40"
            )}
            onDrop={(e) => handleDrop(e, col.status)}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={() => setDragOverCol(null)}
          >
            <p className="text-[10px] font-medium text-muted-foreground mb-1 truncate">{col.label}</p>
            <div className="space-y-1">
              {colTasks.map((task) => (
                <div
                  key={task.id}
                  draggable={canManage}
                  onDragStart={(e) => handleDragStart(e, task)}
                  className={cn(
                    "rounded bg-background px-1.5 py-1 text-[11px] leading-tight shadow-sm border",
                    canManage && "cursor-grab active:cursor-grabbing"
                  )}
                >
                  {task.title}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
