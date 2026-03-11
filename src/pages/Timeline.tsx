import { useState, useMemo, useRef, useCallback } from "react";
import { isPast, isToday } from "date-fns";
import { useInitiatives, Initiative } from "@/hooks/useInitiatives";
import { useAllTasks, Task } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import { useTaskDependencies } from "@/hooks/useTaskDependencies";
import { TimelineFilters, TimelineFiltersState, ZoomLevel, GroupBy, DensityMode } from "@/components/timeline/TimelineFilters";
import { TimelineChart, TimelineChartHandle } from "@/components/timeline/TimelineChart";
import { TimelineNoDates } from "@/components/timeline/TimelineNoDates";
import { InitiativeDetailDrawer } from "@/components/initiatives/InitiativeDetailDrawer";
import { TaskDetailDrawer } from "@/components/tasks/TaskDetailDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CalendarRange, ChevronDown, ChevronRight } from "lucide-react";

export interface TimelineInitiative extends Initiative {
  tasks: (Task & { initiative: { id: string; organization_id: string } })[];
}

interface GroupedInitiatives {
  label: string;
  initiatives: TimelineInitiative[];
}

export default function Timeline() {
  const { initiatives, isLoading: initiativesLoading } = useInitiatives();
  const { tasks, isLoading: tasksLoading } = useAllTasks();
  const { roles, profile } = useAuth();
  const { dependencies } = useTaskDependencies();

  const isAdmin = roles.includes("admin");
  const isManager = roles.includes("manager");

  const chartRef = useRef<TimelineChartHandle>(null);

  const [filters, setFilters] = useState<TimelineFiltersState>({
    status: "all",
    ownerId: "all",
    assigneeUserId: "all",
    assigneeTeamId: "all",
    overdueOnly: false,
  });

  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("month");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [density, setDensity] = useState<DensityMode>("comfortable");
  const [meMode, setMeMode] = useState(false);

  // Collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

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

  const handleScrollToToday = useCallback(() => {
    chartRef.current?.scrollToToday();
  }, []);

  const handleAutofit = useCallback(() => {
    chartRef.current?.autofit();
  }, []);

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

  // Apply filters (including Me Mode)
  const filteredInitiatives = useMemo(() => {
    return timelineInitiatives.filter((initiative) => {
      if (filters.status !== "all" && initiative.status !== filters.status) return false;
      if (filters.ownerId !== "all" && initiative.owner_id !== filters.ownerId) return false;

      if (filters.assigneeUserId !== "all") {
        const hasMatchingTask = initiative.tasks.some((task) => task.assignee_user_id === filters.assigneeUserId);
        if (!hasMatchingTask) return false;
      }

      if (filters.assigneeTeamId !== "all") {
        const hasMatchingTask = initiative.tasks.some((task) => task.assignee_team_id === filters.assigneeTeamId);
        if (!hasMatchingTask) return false;
      }

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

      // Me Mode: show initiatives owned by me OR with tasks assigned to me
      if (meMode && profile?.id) {
        const isMyInitiative = initiative.owner_id === profile.id;
        const hasMyTask = initiative.tasks.some((t) => t.assignee_user_id === profile.id);
        if (!isMyInitiative && !hasMyTask) return false;
      }

      return true;
    });
  }, [timelineInitiatives, filters, meMode, profile?.id]);

  // Group initiatives
  const groupedInitiatives = useMemo((): GroupedInitiatives[] => {
    if (groupBy === "none") {
      return [{ label: "", initiatives: filteredInitiatives }];
    }

    const groups: Record<string, TimelineInitiative[]> = {};

    filteredInitiatives.forEach((initiative) => {
      let key: string;
      switch (groupBy) {
        case "status":
          key = initiative.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          break;
        case "owner":
          key = initiative.owner?.name || initiative.owner?.email || "Unassigned";
          break;
        case "team": {
          const teamNames = new Set<string>();
          initiative.tasks.forEach((t) => {
            if (t.assignee_team) teamNames.add(t.assignee_team.name);
          });
          key = teamNames.size > 0 ? Array.from(teamNames).join(", ") : "No Team";
          break;
        }
        default:
          key = "Other";
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(initiative);
    });

    return Object.entries(groups).map(([label, initiatives]) => ({ label, initiatives }));
  }, [filteredInitiatives, groupBy]);

  // Separate items with dates from those without (per group)
  const processGroup = (items: TimelineInitiative[]) => {
    const withDates: TimelineInitiative[] = [];
    const withoutDates: TimelineInitiative[] = [];

    items.forEach((initiative) => {
      const hasInitiativeDates = initiative.start_date || initiative.end_date;
      const hasTaskDates = initiative.tasks.some((t) => t.start_date || t.due_date);

      if (hasInitiativeDates || hasTaskDates) {
        withDates.push(initiative);
      } else {
        withoutDates.push(initiative);
      }
    });

    return { withDates, withoutDates };
  };

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
    return false;
  };

  const isLoading = initiativesLoading || tasksLoading;

  const totalFiltered = filteredInitiatives.length;

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
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        density={density}
        onDensityChange={setDensity}
        onScrollToToday={handleScrollToToday}
        onAutofit={handleAutofit}
        meMode={meMode}
        onMeModeChange={setMeMode}
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : totalFiltered === 0 ? (
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
        <div className="space-y-6">
          {groupedInitiatives.map((group, groupIndex) => {
            const { withDates, withoutDates } = processGroup(group.initiatives);
            const isGroupCollapsed = collapsedGroups.has(group.label);
            const showGroupHeader = groupBy !== "none" && group.label;

            return (
              <div key={group.label || groupIndex} className="space-y-4">
                {showGroupHeader && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isGroupCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    {group.label}
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">{group.initiatives.length}</Badge>
                  </button>
                )}

                {!isGroupCollapsed && (
                  <div className="space-y-4">
                    {withDates.length > 0 && (
                      <TimelineChart
                        ref={groupIndex === 0 ? chartRef : undefined}
                        initiatives={withDates}
                        zoomLevel={zoomLevel}
                        onZoomLevelChange={setZoomLevel}
                        canDragInitiative={canDragInitiative}
                        canDragTask={canDragTask}
                        onInitiativeClick={handleInitiativeClick}
                        onTaskClick={handleTaskClick}
                        dependencies={dependencies}
                        density={density}
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
              </div>
            );
          })}
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
