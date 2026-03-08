import { useState } from "react";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Task, useTasks, TaskStatus } from "@/hooks/useTasks";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { Progress } from "@/components/ui/progress";

interface SubtaskListProps {
  parentTask: Task;
  initiativeId: string;
  allTasks: Task[];
  canManage: boolean;
  onTaskClick?: (task: Task) => void;
}

export function SubtaskList({ parentTask, initiativeId, allTasks, canManage, onTaskClick }: SubtaskListProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const { createTask } = useTasks(initiativeId);

  const subtasks = allTasks.filter((t) => t.parent_task_id === parentTask.id);
  const doneCount = subtasks.filter((t) => t.status === "done").length;
  const progress = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    createTask.mutate(
      { initiativeId, title: newTitle.trim(), parentTaskId: parentTask.id },
      { onSuccess: () => { setNewTitle(""); setAdding(false); } }
    );
  };

  if (subtasks.length === 0 && !canManage) return null;

  return (
    <div className="mt-2 ml-4 border-l-2 border-border pl-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <button onClick={() => setIsOpen(!isOpen)} className="text-muted-foreground hover:text-foreground">
          {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        <span className="text-xs font-medium text-muted-foreground">
          Subtasks {doneCount}/{subtasks.length}
        </span>
        {subtasks.length > 0 && (
          <Progress value={progress} className="h-1.5 w-16" />
        )}
        {canManage && !adding && (
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setAdding(true)}>
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && (
        <>
          {subtasks.map((st) => (
            <div
              key={st.id}
              className="flex items-center gap-2 py-1 px-2 rounded hover:bg-accent/50 cursor-pointer text-sm"
              onClick={() => onTaskClick?.(st)}
            >
              <span className="flex-1 truncate">{st.title}</span>
              <TaskStatusBadge status={st.status} />
            </div>
          ))}

          {adding && (
            <div className="flex items-center gap-1.5">
              <Input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") { setAdding(false); setNewTitle(""); }
                }}
                placeholder="Subtask title..."
                className="h-7 text-sm"
              />
              <Button size="sm" className="h-7 text-xs" onClick={handleAdd} disabled={!newTitle.trim()}>
                Add
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
