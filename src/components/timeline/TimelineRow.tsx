import { useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimelineInitiative } from "@/pages/Timeline";
import { Task, useTasks } from "@/hooks/useTasks";
import { useInitiatives } from "@/hooks/useInitiatives";
import { InitiativeStatusBadge } from "@/components/initiatives/InitiativeStatusBadge";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TimelineBar } from "./TimelineBar";
import { TimelineMilestone } from "./TimelineMilestone";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { DensityMode } from "./TimelineFilters";

interface TimelineRowProps {
  initiative: TimelineInitiative;
  startDate: Date;
  dayWidth: number;
  getPositionForDate: (date: Date) => number;
  getDateForPosition: (position: number) => Date;
  canDragInitiative: boolean;
  canDragTask: (task: Task & { initiative: { id: string; organization_id: string } }) => boolean;
  onInitiativeDrag: (
    initiativeId: string,
    newStartDate: string | null,
    newEndDate: string | null
  ) => void;
  onTaskDrag: (
    taskId: string,
    initiativeId: string,
    newStartDate: string | null,
    newDueDate: string | null
  ) => void;
  onInitiativeClick: () => void;
  onTaskClick: (task: Task & { initiative: { id: string; organization_id: string } }) => void;
  columns: Date[];
  columnWidth: number;
  density: DensityMode;
}

interface TaskTreeNode {
  task: Task & { initiative: { id: string; organization_id: string } };
  children: TaskTreeNode[];
}

function buildTaskTree(tasks: (Task & { initiative: { id: string; organization_id: string } })[]): TaskTreeNode[] {
  const taskMap = new Map<string, TaskTreeNode>();
  const roots: TaskTreeNode[] = [];

  // Create nodes
  tasks.forEach((task) => {
    taskMap.set(task.id, { task, children: [] });
  });

  // Build tree
  tasks.forEach((task) => {
    const node = taskMap.get(task.id)!;
    if (task.parent_task_id && taskMap.has(task.parent_task_id)) {
      taskMap.get(task.parent_task_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function TimelineRow({
  initiative,
  startDate,
  dayWidth,
  getPositionForDate,
  getDateForPosition,
  canDragInitiative,
  canDragTask,
  onInitiativeDrag,
  onInitiativeClick,
  onTaskClick,
  columns,
  columnWidth,
  density,
}: TimelineRowProps) {
  const [expanded, setExpanded] = useState(true);
  const { createTask, updateTask } = useTasks(initiative.id);
  const { updateInitiative } = useInitiatives();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Track expanded state per task (for subtask collapse)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [allDefaultExpanded] = useState(true); // tasks default expanded

  const isTaskExpanded = useCallback(
    (taskId: string) => {
      if (allDefaultExpanded) {
        return !expandedTasks.has(taskId); // set tracks collapsed ones
      }
      return expandedTasks.has(taskId);
    },
    [expandedTasks, allDefaultExpanded]
  );

  const toggleTask = useCallback((taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  // Inline creation state: which parent task ID is currently showing the create input
  // null = initiative-level, string = task-level
  const [inlineCreateParentId, setInlineCreateParentId] = useState<string | null | undefined>(undefined);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const hasChildren = initiative.tasks.length > 0;
  const isCompact = density === "compact";

  // Progress calculation
  const totalTasks = initiative.tasks.length;
  const doneTasks = initiative.tasks.filter((t) => t.status === "done").length;
  const initiativeProgress = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : undefined;

  const initiativeHasBar = initiative.start_date && initiative.end_date;
  const initiativeHasMilestone = !initiative.start_date && initiative.end_date;

  // Build tree
  const taskTree = useMemo(() => buildTaskTree(initiative.tasks), [initiative.tasks]);

  const handleTaskDrag = async (
    taskId: string,
    newStartDate: string | null,
    newDueDate: string | null
  ) => {
    if (newStartDate && newDueDate && new Date(newDueDate) < new Date(newStartDate)) {
      toast({
        title: "Invalid dates",
        description: "Due date cannot be before start date",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateTask.mutateAsync({
        id: taskId,
        startDate: newStartDate,
        dueDate: newDueDate,
      });
    } catch (error) {
      // Error is handled by mutation
    }
  };

  const handleInitiativeColorChange = async (color: string | null) => {
    try {
      await updateInitiative.mutateAsync({ id: initiative.id, color });
      queryClient.invalidateQueries({ queryKey: ["initiatives", profile?.organization_id] });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleTaskColorChange = async (taskId: string, color: string | null) => {
    try {
      await updateTask.mutateAsync({ id: taskId, color });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleInlineCreate = async (parentTaskId?: string) => {
    const title = newTaskTitle.trim();
    if (!title) return;

    try {
      await createTask.mutateAsync({
        initiativeId: initiative.id,
        title,
        startDate: initiative.start_date || undefined,
        dueDate: initiative.end_date || undefined,
        parentTaskId: parentTaskId || undefined,
      });
      setNewTaskTitle("");
      setInlineCreateParentId(undefined);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const rowPadding = isCompact ? "p-1" : "p-2";

  // Get children count for a task
  const getChildCount = useCallback(
    (taskId: string) => initiative.tasks.filter((t) => t.parent_task_id === taskId).length,
    [initiative.tasks]
  );

  // Recursive task row renderer
  const renderTaskRow = (node: TaskTreeNode, depth: number): React.ReactNode => {
    const task = node.task;
    const taskHasBar = task.start_date && task.due_date;
    const taskHasMilestone = !task.start_date && task.due_date;
    const taskCanDrag = canDragTask(task);
    const hasSubtasks = node.children.length > 0;
    const taskExpanded = isTaskExpanded(task.id);

    // depth 0 = direct child of initiative (pl-10/pl-8)
    // depth 1 = grandchild (pl-14/pl-12)
    // depth 2+ = deeper (pl-18+/pl-16+)
    const basePl = isCompact ? 8 : 10;
    const depthIncrement = 4;
    const paddingLeft = basePl + depth * depthIncrement;

    return (
      <div key={task.id}>
        <div className="flex border-b border-border/40 hover:bg-muted/10 transition-colors duration-150 group/task">
          <div
            className={cn(
              "w-64 min-w-64 sticky left-0 bg-background z-30 flex items-center gap-1 shadow-[2px_0_8px_rgba(0,0,0,0.04)]",
              rowPadding
            )}
            style={{ paddingLeft: `${paddingLeft * 4}px` }} // tailwind units * 4 = px
          >
            {/* Expand/collapse chevron for tasks with children */}
            {hasSubtasks ? (
              <button
                onClick={() => toggleTask(task.id)}
                className="p-0.5 hover:bg-muted rounded flex-shrink-0"
              >
                {taskExpanded ? (
                  <ChevronDown className={cn("h-3.5 w-3.5", isCompact && "h-3 w-3")} />
                ) : (
                  <ChevronRight className={cn("h-3.5 w-3.5", isCompact && "h-3 w-3")} />
                )}
              </button>
            ) : (
              <div className={cn("w-4", isCompact && "w-3.5")} />
            )}

            <div
              className="flex-1 min-w-0 cursor-pointer hover:bg-muted/50 rounded p-1 -m-1"
              onClick={() => onTaskClick(task)}
            >
              <div className="flex items-center gap-1.5">
                <span className={cn("truncate", isCompact ? "text-xs" : "text-sm")}>
                  {task.title}
                </span>
                <TaskStatusBadge status={task.status} />
              </div>
              {!isCompact && (task.assignee_user || task.assignee_team) && (
                <p className="text-xs text-muted-foreground truncate">
                  {task.assignee_user
                    ? task.assignee_user.name || task.assignee_user.email
                    : task.assignee_team?.name}
                </p>
              )}
            </div>

            {/* Add subtask button */}
            {taskCanDrag && (
              <button
                onClick={() => {
                  // Expand this task if collapsed
                  if (!isTaskExpanded(task.id)) toggleTask(task.id);
                  setInlineCreateParentId(task.id);
                  setNewTaskTitle("");
                }}
                className="p-0.5 hover:bg-muted rounded opacity-0 group-hover/task:opacity-100 transition-opacity flex-shrink-0"
                title="Add subtask"
              >
                <Plus className={cn("h-3.5 w-3.5 text-muted-foreground", isCompact && "h-3 w-3")} />
              </button>
            )}
          </div>

          <div
            className="flex-1 relative flex items-center"
            style={{ minWidth: columns.length * columnWidth }}
          >
            <div className="absolute inset-0 flex">
              {columns.map((_, index) => (
                <div
                  key={index}
                  style={{ width: columnWidth }}
                  className="border-r border-dashed border-muted/50"
                />
              ))}
            </div>

            {taskHasBar && (
              <TimelineBar
                startDate={new Date(task.start_date!)}
                endDate={new Date(task.due_date!)}
                getPositionForDate={getPositionForDate}
                getDateForPosition={getDateForPosition}
                dayWidth={dayWidth}
                canDrag={taskCanDrag}
                onDragEnd={(newStart, newEnd) =>
                  handleTaskDrag(
                    task.id,
                    format(newStart, "yyyy-MM-dd"),
                    format(newEnd, "yyyy-MM-dd")
                  )
                }
                onClick={() => onTaskClick(task)}
                variant="task"
                label={task.title}
                ownerName={
                  task.assignee_user?.name ||
                  task.assignee_user?.email ||
                  task.assignee_team?.name
                }
                customColor={task.color}
                onColorChange={
                  taskCanDrag ? (color) => handleTaskColorChange(task.id, color) : undefined
                }
                compact={isCompact}
              />
            )}
            {taskHasMilestone && (
              <TimelineMilestone
                date={new Date(task.due_date!)}
                getPositionForDate={getPositionForDate}
                getDateForPosition={getDateForPosition}
                canDrag={taskCanDrag}
                onDragEnd={(newDate) =>
                  handleTaskDrag(task.id, null, format(newDate, "yyyy-MM-dd"))
                }
                onClick={() => onTaskClick(task)}
                variant="task"
                label={task.title}
                ownerName={
                  task.assignee_user?.name ||
                  task.assignee_user?.email ||
                  task.assignee_team?.name
                }
                customColor={task.color}
                onColorChange={
                  taskCanDrag ? (color) => handleTaskColorChange(task.id, color) : undefined
                }
              />
            )}
          </div>
        </div>

        {/* Inline subtask creation row */}
        {inlineCreateParentId === task.id && (
          <div className="flex border-b bg-muted/10">
            <div
              className={cn(
                "w-64 min-w-64 border-r sticky left-0 bg-background z-30 flex items-center gap-1",
                rowPadding
              )}
              style={{ paddingLeft: `${(paddingLeft + depthIncrement) * 4}px` }}
            >
              <div className={cn("w-4", isCompact && "w-3.5")} />
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInlineCreate(task.id);
                  if (e.key === "Escape") {
                    setInlineCreateParentId(undefined);
                    setNewTaskTitle("");
                  }
                }}
                placeholder="Subtask name, then Enter"
                className={cn("h-7 text-sm", isCompact && "h-6 text-xs")}
                autoFocus
                disabled={createTask.isPending}
              />
            </div>
            <div className="flex-1" style={{ minWidth: columns.length * columnWidth }} />
          </div>
        )}

        {/* Render children recursively */}
        {taskExpanded && node.children.map((child) => renderTaskRow(child, depth + 1))}
      </div>
    );
  };

  return (
    <div>
      {/* Initiative row */}
      <div className="flex border-b hover:bg-muted/20 group/row">
        <div
          className={cn(
            "w-64 min-w-64 border-r sticky left-0 bg-background z-30 flex items-center gap-1",
            rowPadding
          )}
        >
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-0.5 hover:bg-muted rounded flex-shrink-0"
            >
              {expanded ? (
                <ChevronDown className={cn("h-4 w-4", isCompact && "h-3 w-3")} />
              ) : (
                <ChevronRight className={cn("h-4 w-4", isCompact && "h-3 w-3")} />
              )}
            </button>
          ) : (
            <div className={cn("w-5", isCompact && "w-4")} />
          )}
          <div
            className="flex-1 min-w-0 cursor-pointer hover:bg-muted/50 rounded p-1 -m-1"
            onClick={onInitiativeClick}
          >
            <div className="flex items-center gap-1.5">
              <span className={cn("font-medium truncate", isCompact ? "text-xs" : "text-sm")}>
                {initiative.title}
              </span>
              <InitiativeStatusBadge status={initiative.status} />
            </div>
            {!isCompact && initiative.owner && (
              <p className="text-xs text-muted-foreground truncate">
                {initiative.owner.name || initiative.owner.email}
              </p>
            )}
          </div>
          {/* Inline create button for initiative-level tasks */}
          {canDragInitiative && (
            <button
              onClick={() => {
                setExpanded(true);
                setInlineCreateParentId(null);
                setNewTaskTitle("");
              }}
              className="p-0.5 hover:bg-muted rounded opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0"
              title="Add task"
            >
              <Plus className={cn("h-4 w-4 text-muted-foreground", isCompact && "h-3 w-3")} />
            </button>
          )}
        </div>
        <div
          className="flex-1 relative flex items-center"
          style={{ minWidth: columns.length * columnWidth }}
        >
          {/* Grid lines */}
          <div className="absolute inset-0 flex">
            {columns.map((_, index) => (
              <div
                key={index}
                style={{ width: columnWidth }}
                className="border-r border-dashed border-muted/50"
              />
            ))}
          </div>

          {initiativeHasBar && (
            <TimelineBar
              startDate={new Date(initiative.start_date!)}
              endDate={new Date(initiative.end_date!)}
              getPositionForDate={getPositionForDate}
              getDateForPosition={getDateForPosition}
              dayWidth={dayWidth}
              canDrag={canDragInitiative}
              onDragEnd={(newStart, newEnd) =>
                onInitiativeDrag(
                  initiative.id,
                  format(newStart, "yyyy-MM-dd"),
                  format(newEnd, "yyyy-MM-dd")
                )
              }
              onClick={onInitiativeClick}
              variant="initiative"
              label={initiative.title}
              ownerName={initiative.owner?.name || initiative.owner?.email}
              customColor={initiative.color}
              onColorChange={canDragInitiative ? handleInitiativeColorChange : undefined}
              progress={initiativeProgress}
              compact={isCompact}
            />
          )}
          {initiativeHasMilestone && (
            <TimelineMilestone
              date={new Date(initiative.end_date!)}
              getPositionForDate={getPositionForDate}
              getDateForPosition={getDateForPosition}
              canDrag={canDragInitiative}
              onDragEnd={(newDate) =>
                onInitiativeDrag(initiative.id, null, format(newDate, "yyyy-MM-dd"))
              }
              onClick={onInitiativeClick}
              variant="initiative"
              label={initiative.title}
              ownerName={initiative.owner?.name || initiative.owner?.email}
              customColor={initiative.color}
              onColorChange={canDragInitiative ? handleInitiativeColorChange : undefined}
            />
          )}
        </div>
      </div>

      {/* Task rows (recursive tree) */}
      {expanded && taskTree.map((node) => renderTaskRow(node, 0))}

      {/* Inline task creation row (initiative-level, parentId = null) */}
      {expanded && inlineCreateParentId === null && (
        <div className="flex border-b bg-muted/10">
          <div
            className={cn(
              "w-64 min-w-64 border-r sticky left-0 bg-background z-30 flex items-center gap-1",
              rowPadding,
              isCompact ? "pl-8" : "pl-10"
            )}
          >
            <div className={cn("w-4", isCompact && "w-3.5")} />
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInlineCreate();
                if (e.key === "Escape") {
                  setInlineCreateParentId(undefined);
                  setNewTaskTitle("");
                }
              }}
              placeholder="Task name, then Enter"
              className={cn("h-7 text-sm", isCompact && "h-6 text-xs")}
              autoFocus
              disabled={createTask.isPending}
            />
          </div>
          <div className="flex-1" style={{ minWidth: columns.length * columnWidth }} />
        </div>
      )}
    </div>
  );
}
