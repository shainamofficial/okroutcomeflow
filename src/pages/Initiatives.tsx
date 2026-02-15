import { useState, useMemo } from "react";
import { isPast, isToday } from "date-fns";
import { useInitiatives } from "@/hooks/useInitiatives";
import { useAuth } from "@/contexts/AuthContext";
import { CreateInitiativeDialog } from "@/components/initiatives/CreateInitiativeDialog";
import { InitiativeCard } from "@/components/initiatives/InitiativeCard";
import { InitiativeFilters, InitiativeFiltersState } from "@/components/initiatives/InitiativeFilters";
import { BoardView } from "@/components/initiatives/BoardView";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, List, LayoutGrid } from "lucide-react";
import { useAllTasks } from "@/hooks/useTasks";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Initiatives() {
  const { initiatives, isLoading } = useInitiatives();
  const { tasks } = useAllTasks();
  const { roles } = useAuth();

  const canManage = roles.includes("admin") || roles.includes("manager");

  const [view, setView] = useState<"list" | "board">("list");
  const [filters, setFilters] = useState<InitiativeFiltersState>({
    status: "all",
    assigneeUserId: "all",
    assigneeTeamId: "all",
    overdueOnly: false,
  });

  // Group tasks by initiative for filtering
  const tasksByInitiative = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks.forEach((task) => {
      if (!map[task.initiative_id]) {
        map[task.initiative_id] = [];
      }
      map[task.initiative_id].push(task);
    });
    return map;
  }, [tasks]);

  const filteredInitiatives = useMemo(() => {
    return initiatives.filter((initiative) => {
      if (filters.status !== "all" && initiative.status !== filters.status) {
        return false;
      }

      const initiativeTasks = tasksByInitiative[initiative.id] || [];

      if (filters.assigneeUserId !== "all") {
        const hasMatchingTask = initiativeTasks.some(
          (task) => task.assignee_user_id === filters.assigneeUserId
        );
        if (!hasMatchingTask) return false;
      }

      if (filters.assigneeTeamId !== "all") {
        const hasMatchingTask = initiativeTasks.some(
          (task) => task.assignee_team_id === filters.assigneeTeamId
        );
        if (!hasMatchingTask) return false;
      }

      if (filters.overdueOnly) {
        const hasOverdueTask = initiativeTasks.some(
          (task) =>
            task.due_date &&
            task.status !== "done" &&
            isPast(new Date(task.due_date)) &&
            !isToday(new Date(task.due_date))
        );
        if (!hasOverdueTask) return false;
      }

      return true;
    });
  }, [initiatives, filters, tasksByInitiative]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Initiatives</h1>
          <p className="text-muted-foreground mt-1">
            Manage initiatives and link them to Key Results
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "list" | "board")}>
            <TabsList className="h-9">
              <TabsTrigger value="list" className="gap-1.5 px-3">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
              <TabsTrigger value="board" className="gap-1.5 px-3">
                <LayoutGrid className="h-4 w-4" />
                Board
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {canManage && <CreateInitiativeDialog />}
        </div>
      </div>

      <InitiativeFilters filters={filters} onFiltersChange={setFilters} />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : filteredInitiatives.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">
            {initiatives.length === 0 ? "No initiatives yet" : "No matching initiatives"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {initiatives.length === 0
              ? canManage
                ? "Create your first initiative to get started."
                : "No initiatives have been created yet."
              : "Try adjusting your filters."}
          </p>
        </div>
      ) : view === "board" ? (
        <BoardView initiatives={filteredInitiatives} />
      ) : (
        <div className="grid gap-4">
          {filteredInitiatives.map((initiative) => (
            <InitiativeCard key={initiative.id} initiative={initiative} />
          ))}
        </div>
      )}
    </div>
  );
}
