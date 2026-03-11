import { useMemo, useRef, useImperativeHandle, forwardRef } from "react";
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
  isSameMonth,
  min,
  max,
  getDay,
} from "date-fns";
import { cn } from "@/lib/utils";
import { TimelineInitiative } from "@/pages/Timeline";
import { ZoomLevel, DensityMode } from "@/components/timeline/TimelineFilters";
import { Task } from "@/hooks/useTasks";
import { Initiative, useInitiatives } from "@/hooks/useInitiatives";
import { useToast } from "@/hooks/use-toast";
import { TimelineRow } from "./TimelineRow";
import { TimelineDependencyArrows } from "./TimelineDependencyArrows";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TaskDependency } from "@/hooks/useTaskDependencies";

export interface TimelineChartHandle {
  scrollToToday: () => void;
  autofit: () => void;
}

interface TimelineChartProps {
  initiatives: TimelineInitiative[];
  zoomLevel: ZoomLevel;
  onZoomLevelChange: (level: ZoomLevel) => void;
  canDragInitiative: (initiative: Initiative) => boolean;
  canDragTask: (
    task: Task & { initiative: { id: string; organization_id: string } },
    initiative: Initiative
  ) => boolean;
  onInitiativeClick: (initiative: Initiative) => void;
  onTaskClick: (task: Task & { initiative: { id: string; organization_id: string } }) => void;
  dependencies: TaskDependency[];
  density: DensityMode;
}

export const TimelineChart = forwardRef<TimelineChartHandle, TimelineChartProps>(function TimelineChart(
  {
    initiatives,
    zoomLevel,
    canDragInitiative,
    canDragTask,
    onInitiativeClick,
    onTaskClick,
    dependencies,
    density,
  },
  ref
) {
  const { toast } = useToast();
  const { updateInitiative } = useInitiatives();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Calculate date range based on all items
  const { startDate, endDate, columns, columnWidth } = useMemo(() => {
    const allDates: Date[] = [];
    const today = new Date();

    initiatives.forEach((init) => {
      if (init.start_date) allDates.push(new Date(init.start_date));
      if (init.end_date) allDates.push(new Date(init.end_date));
      init.tasks.forEach((task) => {
        if (task.start_date) allDates.push(new Date(task.start_date));
        if (task.due_date) allDates.push(new Date(task.due_date));
      });
    });

    if (allDates.length === 0) {
      allDates.push(today);
    }

    const minDate = min(allDates);
    const maxDate = max(allDates);

    let start: Date;
    let end: Date;
    let cols: Date[];
    let colWidth: number;

    switch (zoomLevel) {
      case "day":
        start = addDays(minDate, -7);
        end = addDays(maxDate, 7);
        cols = eachDayOfInterval({ start, end });
        colWidth = 40;
        break;
      case "week":
        start = startOfWeek(addDays(minDate, -14), { weekStartsOn: 1 });
        end = endOfWeek(addDays(maxDate, 14), { weekStartsOn: 1 });
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

    return {
      startDate: start,
      endDate: end,
      columns: cols,
      columnWidth: colWidth,
    };
  }, [initiatives, zoomLevel]);

  const totalDays = differenceInDays(endDate, startDate) + 1;
  const dayWidth = (columns.length * columnWidth) / totalDays;

  const getPositionForDate = (date: Date): number => {
    const days = differenceInDays(date, startDate);
    return days * dayWidth;
  };

  const getDateForPosition = (position: number): Date => {
    const days = Math.round(position / dayWidth);
    return addDays(startDate, days);
  };

  // Scroll to today + autofit
  useImperativeHandle(ref, () => ({
    scrollToToday: () => {
      const todayPos = getPositionForDate(new Date());
      const scrollContainer = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        const viewportWidth = scrollContainer.clientWidth;
        scrollContainer.scrollLeft = todayPos + 256 - viewportWidth / 2;
      }
    },
    autofit: () => {
      // Return the total date span so parent can pick best zoom
      const scrollContainer = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
      if (!scrollContainer) return;
      const viewportWidth = scrollContainer.clientWidth - 256;
      const spanDays = totalDays;
      // Pick zoom: if span fits in viewport at day level, use day, etc.
      if (spanDays * 40 <= viewportWidth) onZoomLevelChange("day");
      else if (spanDays * (100 / 7) <= viewportWidth) onZoomLevelChange("week");
      else if (spanDays * (120 / 30) <= viewportWidth) onZoomLevelChange("month");
      else onZoomLevelChange("quarter");
    },
  }));

  const handleInitiativeDrag = async (
    initiativeId: string,
    newStartDate: string | null,
    newEndDate: string | null
  ) => {
    if (newStartDate && newEndDate && new Date(newEndDate) < new Date(newStartDate)) {
      toast({
        title: "Invalid dates",
        description: "End date cannot be before start date",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateInitiative.mutateAsync({
        id: initiativeId,
        startDate: newStartDate || undefined,
        endDate: newEndDate || undefined,
      });
    } catch (error) {
      // Error is handled by mutation
    }
  };

  const handleTaskDrag = async (
    taskId: string,
    initiativeId: string,
    newStartDate: string | null,
    newDueDate: string | null
  ) => {
    // Handled by TimelineRow
  };

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
        return (
          columnDate.getFullYear() === today.getFullYear() &&
          columnDate.getMonth() === today.getMonth() &&
          columnDate.getDate() === today.getDate()
        );
      case "week":
        return isWithinInterval(today, {
          start: startOfWeek(columnDate, { weekStartsOn: 1 }),
          end: endOfWeek(columnDate, { weekStartsOn: 1 }),
        });
      case "month":
        return isWithinInterval(today, {
          start: startOfMonth(columnDate),
          end: endOfMonth(columnDate),
        });
      case "quarter":
        return isWithinInterval(today, {
          start: startOfQuarter(columnDate),
          end: endOfQuarter(columnDate),
        });
    }
  };

  const isWeekend = (date: Date): boolean => {
    const day = getDay(date);
    return day === 0 || day === 6;
  };

  const todayPosition = getPositionForDate(new Date());
  const isTodayVisible = isWithinInterval(new Date(), { start: startDate, end: endDate });

  return (
    <div className="rounded-xl shadow-card overflow-hidden bg-background relative">
      {/* Top accent gradient bar */}
      <div className="h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
      <ScrollArea className="w-full" ref={scrollAreaRef}>
        <div className="min-w-max" ref={containerRef}>
          {/* Header row with dates — frosted glass */}
          <div className="flex shadow-sm sticky top-0 z-10 backdrop-blur-md bg-background/80">
            <div className="w-64 min-w-64 p-3 font-semibold sticky left-0 bg-background/90 backdrop-blur-md z-30 text-sm shadow-[2px_0_8px_rgba(0,0,0,0.06)]">
              Item
            </div>
            <div className="flex relative">
              {columns.map((col, index) => (
                <div
                  key={index}
                  style={{ width: columnWidth }}
                  className={cn(
                    "p-2 text-center text-xs font-medium border-r border-border/30 bg-transparent",
                    isTodayInColumn(col) && "bg-primary/8 shadow-[inset_0_-2px_0_0_hsl(var(--primary)/0.3)]",
                    zoomLevel === "day" && isWeekend(col) && "bg-muted/40"
                  )}
                >
                  {formatColumnHeader(col)}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline rows */}
          <div className="relative">
            {/* Today indicator — glowing line with pulse dot */}
            {isTodayVisible && (
              <>
                <div
                  className="absolute top-0 w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.6)] z-20 pointer-events-none animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
                  style={{ left: 256 + todayPosition - 5, top: -6 }}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/60 to-transparent z-10 pointer-events-none shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
                  style={{ left: 256 + todayPosition }}
                />
              </>
            )}

            {/* Dependency arrows */}
            <TimelineDependencyArrows
              dependencies={dependencies}
              initiatives={initiatives}
              getPositionForDate={getPositionForDate}
              dayWidth={dayWidth}
              stickyColumnWidth={256}
            />

            {initiatives.map((initiative) => (
              <TimelineRow
                key={initiative.id}
                initiative={initiative}
                startDate={startDate}
                dayWidth={dayWidth}
                getPositionForDate={getPositionForDate}
                getDateForPosition={getDateForPosition}
                canDragInitiative={canDragInitiative(initiative)}
                canDragTask={(task) => canDragTask(task, initiative)}
                onInitiativeDrag={handleInitiativeDrag}
                onTaskDrag={handleTaskDrag}
                onInitiativeClick={() => onInitiativeClick(initiative)}
                onTaskClick={onTaskClick}
                columns={columns}
                columnWidth={columnWidth}
                density={density}
              />
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
});
