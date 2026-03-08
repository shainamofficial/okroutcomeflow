import { useState } from "react";
import { Pencil, Trash2, ListTodo, MoreHorizontal } from "lucide-react";
import { Task, useTasks } from "@/hooks/useTasks";
import { TaskItem } from "./TaskItem";
import { EditTaskDialog } from "./EditTaskDialog";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { TaskDetailDrawer } from "./TaskDetailDrawer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskListProps {
  initiativeId: string;
  initiativeOwnerId?: string | null;
  canManage: boolean;
}

export function TaskList({ initiativeId, initiativeOwnerId, canManage }: TaskListProps) {
  const { profile, roles } = useAuth();
  const { tasks, isLoading } = useTasks(initiativeId);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const isAdmin = roles.includes("admin");
  const isManager = roles.includes("manager");
  const isInitiativeOwner = initiativeOwnerId === profile?.id;

  const canEditTask = (task: Task) => {
    if (isAdmin || isManager || isInitiativeOwner) return true;
    // Contributors can edit tasks assigned to them
    return task.assignee_user_id === profile?.id;
  };

  const canDeleteTask = () => {
    return isAdmin || isManager || isInitiativeOwner;
  };

  const canCreateTask = canManage || isInitiativeOwner;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4" />
          <h3 className="font-medium">Tasks ({tasks.length})</h3>
        </div>
        {canCreateTask && <CreateTaskDialog initiativeId={initiativeId} />}
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No tasks yet.
          {canCreateTask && " Add a task to get started."}
        </p>
      ) : (
        <div className="space-y-2">
          {/* Only show top-level tasks (no parent) */}
          {tasks.filter(t => !t.parent_task_id).map((task) => (
            <div key={task.id} className="relative group">
              <TaskItem
                task={task}
                onClick={() => setViewingTask(task)}
                subtaskCount={tasks.filter(t => t.parent_task_id === task.id).length}
                subtaskDoneCount={tasks.filter(t => t.parent_task_id === task.id && t.status === "done").length}
              />
              {(canEditTask(task) || canDeleteTask()) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEditTask(task) && (
                      <DropdownMenuItem onClick={() => setEditingTask(task)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {canDeleteTask() && (
                      <DropdownMenuItem
                        onClick={() => setDeletingTask(task)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {/* Subtask list for this task */}
              <SubtaskList
                parentTask={task}
                initiativeId={initiativeId}
                allTasks={tasks}
                canManage={canEditTask(task)}
                onTaskClick={(st) => setViewingTask(st)}
              />
            </div>
          ))}
        </div>
      )}

      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
        />
      )}

      {deletingTask && (
        <DeleteTaskDialog
          task={deletingTask}
          open={!!deletingTask}
          onOpenChange={(open) => !open && setDeletingTask(null)}
        />
      )}

      {viewingTask && (
        <TaskDetailDrawer
          task={viewingTask}
          open={!!viewingTask}
          onOpenChange={(open) => !open && setViewingTask(null)}
        />
      )}
    </div>
  );
}
