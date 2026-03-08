import { useState, useMemo } from "react";
import { isPast, isToday } from "date-fns";
import { useInitiatives, Initiative } from "@/hooks/useInitiatives";
import { useAllTasks, Task } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import { TimelineFilters, TimelineFiltersState, ZoomLevel } from "@/components/timeline/TimelineFilters";
import { TimelineChart } from "@/components/timeline/TimelineChart";
import { TimelineNoDates } from "@/components/timeline/TimelineNoDates";
import { InitiativeDetailDrawer } from "@/components/initiatives/InitiativeDetailDrawer";
import { TaskDetailDrawer } from "@/components/tasks/TaskDetailDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarRange } from "lucide-react";

export interface TimelineInitiative extends Initiative {
  tasks: (Task & { initiative: { id: string; organization_id: string } })[];
}

export default function Timeline() {
  const { initiatives, isLoading: initiativesLoading } = useInitiatives();
  const { tasks, isLoading: tasksLoading } = useAllTasks();
  const { roles, profile } = useAuth();

  const isAdmin = roles.includes("admin");
  const isManager = roles.includes("manager");

  const [filters, setFilters] = useState<TimelineFiltersState>({
    status: "all",
    ownerId: "all",
    assigneeUserId: "all",
    assigneeTeamId: "all",
    overdueOnly: false,
  });

  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("month");

  // Drawer state
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);
  const [selectedTask, setSelectedTask] = useState<(Task & { initiative: { id: string; organization_id: string } }) | null>(null);
  const [initiativeDrawerOpen, setInitiativeDrawerOpen] = useState(false);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);

  const handleInitiativeClick = (initiative: Initiative) => {
    setSelectedInitiative(initiative);
    setInitiativeDrawerOpen(true);
  };

  const handleTaskClick = (task: Task & { initiative: { id: string; organization_id: string } }) => {
    setSelectedTask(task);
    setTaskDrawerOpen(true);
  };

  // Group tasks by initiative
  const tasksByInitiative = useMemo(() => {
    const map: Record<string, (Task & { initiative: { id: string; organization_id: string } })[]> = {};
    tasks.forEach((task) => {
      if (!map[task.initiative_id]) {
        map[task.initiative_id] = [];
      }
      map[task.initiative_id].push(task);
    });
    return map;
  }, [tasks]);

  // Create timeline initiatives with their tasks
  const timelineInitiatives = useMemo(() => {
    return initiatives.map((initiative) => ({
      ...initiative,
      tasks: tasksByInitiative[initiative.id] || [],
    }));
  }, [initiatives, tasksByInitiative]);

  // Apply filters
  const filteredInitiatives = useMemo(() => {
    return timelineInitiatives.filter((initiative) => {
      // Filter by initiative status
      if (filters.status !== "all" && initiative.status !== filters.status) {
        return false;
      }

      // Filter by owner
      if (filters.ownerId !== "all" && initiative.owner_id !== filters.ownerId) {
        return false;
      }

      // Filter by assignee user (checks tasks)
      if (filters.assigneeUserId !== "all") {
        const hasMatchingTask = initiative.tasks.some(
          (task) => task.assignee_user_id === filters.assigneeUserId
        );
        if (!hasMatchingTask) return false;
      }

      // Filter by assignee team
      if (filters.assigneeTeamId !== "all") {
        const hasMatchingTask = initiative.tasks.some(
          (task) => task.assignee_team_id === filters.assigneeTeamId
        );
        if (!hasMatchingTask) return false;
      }

      // Filter by overdue
      if (filters.overdueOnly) {
        const hasOverdue =
          (initiative.end_date &&
            initiative.status !== "completed" &&
            isPast(new Date(initiative.end_date)) &&
            !isToday(new Date(initiative.end_date))) ||
          initiative.tasks.some(
            (task) =>
              task.due_date &&
              task.status !== "done" &&
              isPast(new Date(task.due_date)) &&
              !isToday(new Date(task.due_date))
          );
        if (!hasOverdue) return false;
      }

      return true;
    });
  }, [timelineInitiatives, filters]);

  // Separate items with dates from those without
  const { withDates, withoutDates } = useMemo(() => {
    const withDates: TimelineInitiative[] = [];
    const withoutDates: TimelineInitiative[] = [];

    filteredInitiatives.forEach((initiative) => {
      const hasInitiativeDates = initiative.start_date || initiative.end_date;
      const hasTaskDates = initiative.tasks.some((t) => t.start_date || t.due_date);

      if (hasInitiativeDates || hasTaskDates) {
        withDates.push(initiative);
      } else {
        withoutDates.push(initiative);
      }
    });

    return { withDates, withoutDates };
  }, [filteredInitiatives]);

  // Determine if user can drag a specific item
  const canDragInitiative = (initiative: Initiative) => {
    if (isAdmin || isManager) return true;
    if (initiative.owner_id === profile?.id) return true;
    return false;
  };

  const canDragTask = (
    task: Task & { initiative: { id: string; organization_id: string } },
    initiative: Initiative
  ) => {
    if (isAdmin || isManager) return true;
    if (initiative.owner_id === profile?.id) return true;
    if (task.assignee_user_id === profile?.id) return true;
    // Note: Team member check would require additional data
    return false;
  };

  const isLoading = initiativesLoading || tasksLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold">Timeline</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base hidden sm:block">
          Visualize initiatives and tasks on a timeline
        </p>
      </div>

      <TimelineFilters
        filters={filters}
        onFiltersChange={setFilters}
        zoomLevel={zoomLevel}
        onZoomLevelChange={setZoomLevel}
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredInitiatives.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CalendarRange className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">
            {initiatives.length === 0 ? "No initiatives yet" : "No matching items"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {initiatives.length === 0
              ? "Create initiatives to see them on the timeline."
              : "Try adjusting your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {withDates.length > 0 && (
            <TimelineChart
              initiatives={withDates}
              zoomLevel={zoomLevel}
              canDragInitiative={canDragInitiative}
              canDragTask={canDragTask}
              onInitiativeClick={handleInitiativeClick}
              onTaskClick={handleTaskClick}
            />
          )}

          {withoutDates.length > 0 && (
            <TimelineNoDates 
              initiatives={withoutDates}
              onInitiativeClick={handleInitiativeClick}
              onTaskClick={handleTaskClick}
            />
          )}
        </div>
      )}

      {/* Detail Drawers */}
      {selectedInitiative && (
        <InitiativeDetailDrawer
          initiative={selectedInitiative}
          open={initiativeDrawerOpen}
          onOpenChange={setInitiativeDrawerOpen}
        />
      )}

      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          open={taskDrawerOpen}
          onOpenChange={setTaskDrawerOpen}
        />
      )}
    </div>
  );
}
