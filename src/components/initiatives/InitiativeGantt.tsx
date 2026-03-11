import { useMemo, useState } from "react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachQuarterOfInterval,
  eachDayOfInterval,
  format,
  differenceInDays,
  addDays,
  addMonths,
  isWithinInterval,
  min,
  max,
  getDay,
} from "date-fns";
import { cn } from "@/lib/utils";
import { TimelineBar } from "@/components/timeline/TimelineBar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ZoomIn, ZoomOut } from "lucide-react";

type ZoomLevel = "day" | "week" | "month" | "quarter";

interface GanttTask {
  id: string;
  title: string;
  status: string;
  start_date: string | null;
  due_date: string | null;
  parent_task_id: string | null;
  color: string | null;
  assignee?: { id: string; name: string } | null;
  assignee_team?: { id: string; name: string } | null;
}

interface InitiativeGanttProps {
  tasks: GanttTask[];
  initiativeStartDate?: string | null;
  initiativeEndDate?: string | null;
}

interface TaskTreeNode {
  task: GanttTask;
  children: TaskTreeNode[];
}

function buildTaskTree(tasks: GanttTask[]): TaskTreeNode[] {
  const taskMap = new Map<string, TaskTreeNode>();
  const roots: TaskTreeNode[] = [];
  tasks.forEach((t) => taskMap.set(t.id, { task: t, children: [] }));
  tasks.forEach((t) => {
    const node = taskMap.get(t.id)!;
    if (t.parent_task_id && taskMap.has(t.parent_task_id)) {
      taskMap.get(t.parent_task_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export function InitiativeGantt({
  tasks,
  initiativeStartDate,
  initiativeEndDate,
}: InitiativeGanttProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("week");

  const { startDate, endDate, columns, columnWidth } = useMemo(() => {
    const allDates: Date[] = [];
    const today = new Date();

    if (initiativeStartDate) allDates.push(new Date(initiativeStartDate));
    if (initiativeEndDate) allDates.push(new Date(initiativeEndDate));
    tasks.forEach((t) => {
      if (t.start_date) allDates.push(new Date(t.start_date));
      if (t.due_date) allDates.push(new Date(t.due_date));
    });

    if (allDates.length === 0) allDates.push(today);

    const minDate = min(allDates);
    const maxDate = max(allDates);

    let start: Date, end: Date, cols: Date[], colWidth: number;

    switch (zoomLevel) {
      case "day":
        start = addDays(minDate, -3);
        end = addDays(maxDate, 3);
        cols = eachDayOfInterval({ start, end });
        colWidth = 40;
        break;
      case "week":
        start = startOfWeek(addDays(minDate, -7), { weekStartsOn: 1 });
        end = endOfWeek(addDays(maxDate, 7), { weekStartsOn: 1 });
        cols = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
        colWidth = 100;
        break;
      case "month":
        start = startOfMonth(addMonths(minDate, -1));
        end = endOfMonth(addMonths(maxDate, 1));
        cols = eachMonthOfInterval({ start, end });
        colWidth = 120;
        break;
      case "quarter":
        start = startOfQuarter(addMonths(minDate, -3));
        end = endOfQuarter(addMonths(maxDate, 3));
        cols = eachQuarterOfInterval({ start, end });
        colWidth = 150;
        break;
    }

    return { startDate: start, endDate: end, columns: cols, columnWidth: colWidth };
  }, [tasks, zoomLevel, initiativeStartDate, initiativeEndDate]);

  const totalDays = differenceInDays(endDate, startDate) + 1;
  const dayWidth = (columns.length * columnWidth) / totalDays;

  const getPositionForDate = (date: Date): number => differenceInDays(date, startDate) * dayWidth;
  const getDateForPosition = (position: number): Date => addDays(startDate, Math.round(position / dayWidth));

  const formatColumnHeader = (date: Date): string => {
    switch (zoomLevel) {
      case "day": {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return `${dayNames[getDay(date)]} ${format(date, "d")}`;
      }
      case "week":
        return format(date, "MMM d");
      case "month":
        return format(date, "MMM yyyy");
      case "quarter":
        return `Q${Math.ceil((date.getMonth() + 1) / 3)} ${format(date, "yyyy")}`;
    }
  };

  const isTodayInColumn = (columnDate: Date): boolean => {
    const today = new Date();
    switch (zoomLevel) {
      case "day":
        return columnDate.toDateString() === today.toDateString();
      case "week":
        return isWithinInterval(today, {
          start: startOfWeek(columnDate, { weekStartsOn: 1 }),
          end: endOfWeek(columnDate, { weekStartsOn: 1 }),
        });
      case "month":
        return isWithinInterval(today, { start: startOfMonth(columnDate), end: endOfMonth(columnDate) });
      case "quarter":
        return isWithinInterval(today, { start: startOfQuarter(columnDate), end: endOfQuarter(columnDate) });
    }
  };

  const isWeekend = (date: Date): boolean => {
    const day = getDay(date);
    return day === 0 || day === 6;
  };

  const todayPosition = getPositionForDate(new Date());
  const isTodayVisible = isWithinInterval(new Date(), { start: startDate, end: endDate });

  const taskTree = useMemo(() => buildTaskTree(tasks), [tasks]);

  const tasksWithDates = tasks.filter((t) => t.start_date && t.due_date);

  if (tasksWithDates.length === 0 && !initiativeStartDate) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No tasks with dates to display on the timeline.
      </div>
    );
  }

  const renderTaskRow = (node: TaskTreeNode, depth: number): React.ReactNode => {
    const task = node.task;
    const hasBar = task.start_date && task.due_date;
    const paddingLeft = 10 + depth * 4;

    return (
      <div key={task.id}>
        <div className="flex border-b border-border/40 hover:bg-muted/10 transition-colors duration-150">
          <div
            className="w-52 min-w-52 sticky left-0 bg-background z-30 flex items-center gap-1 p-1.5 shadow-[2px_0_8px_rgba(0,0,0,0.04)]"
            style={{ paddingLeft: `${paddingLeft * 4}px` }}
          >
            <span className="text-xs truncate">{task.title}</span>
          </div>
          <div
            className="flex-1 relative flex items-center h-8"
            style={{ minWidth: columns.length * columnWidth }}
          >
            <div className="absolute inset-0 flex">
              {columns.map((_, i) => (
                <div key={i} style={{ width: columnWidth }} className="border-r border-dashed border-muted/50" />
              ))}
            </div>
            {hasBar && (
              <TimelineBar
                startDate={new Date(task.start_date!)}
                endDate={new Date(task.due_date!)}
                getPositionForDate={getPositionForDate}
                getDateForPosition={getDateForPosition}
                dayWidth={dayWidth}
                canDrag={false}
                onDragEnd={() => {}}
                variant="task"
                label={task.title}
                ownerName={task.assignee?.name || task.assignee_team?.name}
                status={task.status as any}
                customColor={task.color}
                compact
              />
            )}
          </div>
        </div>
        {node.children.map((child) => renderTaskRow(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center gap-2">
        <Select value={zoomLevel} onValueChange={(v) => setZoomLevel(v as ZoomLevel)}>
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="quarter">Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chart */}
      <div className="rounded-lg border overflow-hidden bg-background">
        <ScrollArea className="w-full">
          <div className="min-w-max">
            {/* Header */}
            <div className="shadow-sm sticky top-0 z-10 backdrop-blur-md bg-background/80">
              {(zoomLevel === "day" || zoomLevel === "week") && (
                <div className="flex">
                  <div className="w-52 min-w-52 sticky left-0 bg-background/90 backdrop-blur-md z-30" />
                  <div className="flex relative">
                    {(() => {
                      const superHeaders: { label: string; span: number }[] = [];
                      let currentLabel = "";
                      let currentSpan = 0;
                      columns.forEach((col) => {
                        const label = format(col, "MMMM yyyy");
                        if (label === currentLabel) {
                          currentSpan++;
                        } else {
                          if (currentLabel) superHeaders.push({ label: currentLabel, span: currentSpan });
                          currentLabel = label;
                          currentSpan = 1;
                        }
                      });
                      if (currentLabel) superHeaders.push({ label: currentLabel, span: currentSpan });
                      return superHeaders.map((sh, i) => (
                        <div
                          key={i}
                          style={{ width: sh.span * columnWidth }}
                          className="px-2 py-1 text-xs font-semibold text-muted-foreground border-r border-border/30 truncate"
                        >
                          {sh.label}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
              <div className="flex">
                <div className="w-52 min-w-52 p-2 font-semibold sticky left-0 bg-background/90 backdrop-blur-md z-30 text-xs">
                  Task
                </div>
                <div className="flex relative">
                  {columns.map((col, index) => (
                    <div
                      key={index}
                      style={{ width: columnWidth }}
                      className={cn(
                        "p-1.5 text-center text-[10px] font-medium border-r border-border/30",
                        isTodayInColumn(col) && "bg-primary/8",
                        zoomLevel === "day" && isWeekend(col) && "bg-muted/40"
                      )}
                    >
                      {formatColumnHeader(col)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rows */}
            <div className="relative">
              {isTodayVisible && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary/60 z-10 pointer-events-none"
                  style={{ left: 208 + todayPosition }}
                />
              )}
              {taskTree.map((node) => renderTaskRow(node, 0))}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
