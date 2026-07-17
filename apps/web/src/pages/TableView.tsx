import { useState, useMemo, useEffect } from "react";
import { useAllTasks, Task, TaskStatus } from "@/hooks/useTasks";
import { useInitiatives } from "@/hooks/useInitiatives";
import { useCustomFields, useCustomFieldValues } from "@/hooks/useCustomFields";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, Download, Filter, ChevronDown } from "lucide-react";
import { isPast, isToday, format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { InlineEditCell } from "@/components/table/InlineEditCell";
import { InlineStatusSelect } from "@/components/table/InlineStatusSelect";
import { InlineDatePicker } from "@/components/table/InlineDatePicker";
import { CustomFieldCell } from "@/components/custom-fields/CustomFieldCell";
import { CustomFieldManager } from "@/components/custom-fields/CustomFieldManager";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { Badge } from "@/components/ui/badge";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type SortField = "title" | "status" | "due_date" | "assignee" | "initiative";
type SortDir = "asc" | "desc";

export default function TableView() {
  const { tasks } = useAllTasks();
  const { initiatives } = useInitiatives();
  const { definitions } = useCustomFields("task");
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sortField, setSortField] = useState<SortField>("due_date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<"none" | "initiative" | "status">("none");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);
  const { getValue, upsertValue } = useCustomFieldValues(taskIds);

  const initiativeMap = useMemo(() => {
    const map: Record<string, string> = {};
    initiatives.forEach((i) => (map[i.id] = i.title));
    return map;
  }, [initiatives]);

  const updateTask = async (id: string, updates: Record<string, unknown>) => {
    // Optimistic: patch the cached rows immediately, roll back if the write fails.
    const cacheKey = ["all_tasks", profile?.organization_id];
    const previous = queryClient.getQueryData<Task[]>(cacheKey);
    queryClient.setQueryData<Task[]>(cacheKey, (old) =>
      old?.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );

    try {
      // Map the snake_case column patch to the API's camelCase input.
      const keyMap: Record<string, string> = {
        due_date: "dueDate",
        start_date: "startDate",
        assignee_user_id: "assigneeUserId",
        assignee_team_id: "assigneeTeamId",
      };
      const apiInput: Record<string, unknown> = { id };
      for (const [k, v] of Object.entries(updates)) apiInput[keyMap[k] ?? k] = v;
      await trpc.tasks.update.mutate(apiInput as Parameters<typeof trpc.tasks.update.mutate>[0]);
      queryClient.invalidateQueries({ queryKey: ["all_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      queryClient.setQueryData(cacheKey, previous);
      toast({
        title: "Failed to update task",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title": cmp = a.title.localeCompare(b.title); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "due_date": cmp = (a.due_date || "9999").localeCompare(b.due_date || "9999"); break;
        case "assignee": cmp = (a.assignee_user?.name || "zzz").localeCompare(b.assignee_user?.name || "zzz"); break;
        case "initiative": cmp = (initiativeMap[a.initiative_id] || "").localeCompare(initiativeMap[b.initiative_id] || ""); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [tasks, statusFilter, sortField, sortDir, initiativeMap]);

  const grouped = useMemo(() => {
    if (groupBy === "none") return { "": filteredTasks };
    const map: Record<string, typeof filteredTasks> = {};
    filteredTasks.forEach((t) => {
      const key = groupBy === "initiative" ? (initiativeMap[t.initiative_id] || "Unlinked") : t.status;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [filteredTasks, groupBy, initiativeMap]);

  // Progressive rendering: only mount ROW_CHUNK rows at a time and reveal more
  // as the user scrolls, so a large org's task table stays fast on first paint.
  // (Server-side pagination replaces this in the backend migration.)
  const ROW_CHUNK = 60;
  const [visibleCount, setVisibleCount] = useState(ROW_CHUNK);
  useEffect(() => {
    setVisibleCount(ROW_CHUNK);
  }, [statusFilter, sortField, sortDir, groupBy]);

  const groupsToRender = useMemo(() => {
    let budget = visibleCount;
    return Object.entries(grouped)
      .map(([group, groupTasks]) => {
        const shown = groupTasks.slice(0, Math.max(0, budget));
        budget -= shown.length;
        return { group, shown, total: groupTasks.length };
      })
      .filter(({ shown, total }) => total === 0 || shown.length > 0);
  }, [grouped, visibleCount]);

  const hasMoreRows = visibleCount < filteredTasks.length;
  const sentinelRef = useInfiniteScroll(
    () => setVisibleCount((c) => c + ROW_CHUNK),
    hasMoreRows
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const exportCSV = () => {
    const headers = ["Task", "Status", "Initiative", "Assignee", "Due Date", ...definitions.map((d) => d.name)];
    const rows = filteredTasks.map((t) => [
      t.title,
      t.status.replace(/_/g, " "),
      initiativeMap[t.initiative_id] || "",
      t.assignee_user?.name || t.assignee_team?.name || "Unassigned",
      t.due_date || "",
      ...definitions.map((d) => String(getValue(d.id, t.id) ?? "")),
    ]);
    const escapeCSV = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map((c) => escapeCSV(c)).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks-export.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const colSpan = 5 + definitions.length;

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/40 transition-colors"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={cn("h-3 w-3", sortField === field ? "text-foreground" : "text-muted-foreground/40")} />
      </div>
    </TableHead>
  );

  const toolbar = (
    <div className="flex items-center gap-2 flex-wrap">
      <CustomFieldManager entityType="task" />
      <Button variant="outline" size="sm" onClick={exportCSV} className="h-9 text-xs gap-1.5">
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Export CSV</span>
      </Button>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[110px] sm:w-[130px] h-9 text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="todo">To Do</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="blocked">Blocked</SelectItem>
          <SelectItem value="done">Done</SelectItem>
        </SelectContent>
      </Select>
      <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "none" | "initiative" | "status")}>
        <SelectTrigger className="w-[110px] sm:w-[140px] h-9 text-xs">
          <SelectValue placeholder="Group by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Grouping</SelectItem>
          <SelectItem value="initiative">By Initiative</SelectItem>
          <SelectItem value="status">By Status</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  // Mobile card view for each task
  const MobileTaskCard = ({ task }: { task: Task }) => {
    const isOverdue = task.due_date && task.status !== "done" && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
    return (
      <div className="p-3 border rounded-lg bg-card space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium flex-1">{task.title}</span>
          <InlineStatusSelect
            status={task.status}
            onStatusChange={(status) => updateTask(task.id, { status })}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{task.assignee_user?.name || task.assignee_team?.name || "Unassigned"}</span>
          <InlineDatePicker
            date={task.due_date}
            onDateChange={(date) => updateTask(task.id, { due_date: date })}
            isOverdue={!!isOverdue}
          />
        </div>
        {initiativeMap[task.initiative_id] && (
          <div className="text-xs text-muted-foreground truncate">
            {initiativeMap[task.initiative_id]}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold font-display">Table View</h1>
          <p className="text-muted-foreground mt-1 text-sm hidden sm:block">Click any cell to edit inline</p>
        </div>
        {isMobile ? (
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 w-full justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filters & Actions</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              {toolbar}
            </CollapsibleContent>
          </Collapsible>
        ) : toolbar}
      </div>

      {groupsToRender.map(({ group, shown: groupTasks, total: groupTotal }) => (
        <div key={group}>
          {group && groupBy !== "none" && (
            <h3 className="text-sm font-semibold font-display mb-2 capitalize">{group.replace(/_/g, " ")}</h3>
          )}

          {/* Mobile: card layout */}
          {isMobile ? (
            <div className="space-y-2">
              {groupTotal === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No tasks found</p>
              ) : (
                groupTasks.map((task) => <MobileTaskCard key={task.id} task={task} />)
              )}
            </div>
          ) : (
            /* Desktop: table layout */
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <SortHeader field="title">Task</SortHeader>
                        <SortHeader field="status">Status</SortHeader>
                        <SortHeader field="initiative">Initiative</SortHeader>
                        <SortHeader field="assignee">Assignee</SortHeader>
                        <SortHeader field="due_date">Due Date</SortHeader>
                        {definitions.map((d) => (
                          <TableHead key={d.id} className="text-xs whitespace-nowrap">{d.name}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupTotal === 0 ? (
                        <TableRow>
                          <TableCell colSpan={colSpan} className="text-center text-sm text-muted-foreground py-8">
                            No tasks found
                          </TableCell>
                        </TableRow>
                      ) : (
                        groupTasks.map((task) => {
                          const isOverdue = task.due_date && task.status !== "done" && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
                          return (
                            <TableRow key={task.id} className="hover:bg-muted/20">
                              <TableCell className="font-medium text-sm max-w-[250px]">
                                <InlineEditCell
                                  value={task.title}
                                  onSave={(title) => updateTask(task.id, { title })}
                                />
                              </TableCell>
                              <TableCell>
                                <InlineStatusSelect
                                  status={task.status}
                                  onStatusChange={(status) => updateTask(task.id, { status })}
                                />
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                                {initiativeMap[task.initiative_id] || "—"}
                              </TableCell>
                              <TableCell className="text-xs">
                                {task.assignee_user?.name || task.assignee_team?.name || (
                                  <span className="text-muted-foreground">Unassigned</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <InlineDatePicker
                                  date={task.due_date}
                                  onDateChange={(date) => updateTask(task.id, { due_date: date })}
                                  isOverdue={!!isOverdue}
                                />
                              </TableCell>
                              {definitions.map((d) => (
                                <TableCell key={d.id}>
                                  <CustomFieldCell
                                    definition={d}
                                    value={getValue(d.id, task.id)}
                                    onValueChange={(val) =>
                                      upsertValue.mutate({
                                        field_definition_id: d.id,
                                        entity_type: "task",
                                        entity_id: task.id,
                                        value: val,
                                      })
                                    }
                                  />
                                </TableCell>
                              ))}
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ))}
      {hasMoreRows && (
        <div ref={sentinelRef} className="py-2 text-center text-xs text-muted-foreground">
          Showing {visibleCount} of {filteredTasks.length} tasks — scroll for more
        </div>
      )}
    </div>
  );
}
