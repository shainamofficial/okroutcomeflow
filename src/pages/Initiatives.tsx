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
      if (filters.status !== "all" && initiative.status !== filters.status) return false;
      const initiativeTasks = tasksByInitiative[initiative.id] || [];
      if (filters.assigneeUserId !== "all") {
        if (!initiativeTasks.some((task) => task.assignee_user_id === filters.assigneeUserId)) return false;
      }
      if (filters.assigneeTeamId !== "all") {
        if (!initiativeTasks.some((task) => task.assignee_team_id === filters.assigneeTeamId)) return false;
      }
      if (filters.overdueOnly) {
        if (!initiativeTasks.some((task) => task.due_date && task.status !== "done" && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)))) return false;
      }
      return true;
    });
  }, [initiatives, filters, tasksByInitiative]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold font-display">Initiatives</h1>
          <p className="text-muted-foreground mt-1 text-sm hidden sm:block">
            Manage initiatives and link them to Key Results
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Tabs value={view} onValueChange={(v) => setView(v as "list" | "board")}>
            <TabsList className="h-9 bg-muted/60">
              <TabsTrigger value="list" className="gap-1.5 px-2 sm:px-3 text-xs">
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">List</span>
              </TabsTrigger>
              <TabsTrigger value="board" className="gap-1.5 px-2 sm:px-3 text-xs">
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Board</span>
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
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredInitiatives.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <Lightbulb className="h-8 w-8 text-accent-foreground" />
          </div>
          <h2 className="text-xl font-bold font-display">
            {initiatives.length === 0 ? "No initiatives yet" : "No matching initiatives"}
          </h2>
          <p className="text-muted-foreground mt-1 max-w-sm">
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
