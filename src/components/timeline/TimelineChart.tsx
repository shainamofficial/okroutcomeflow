import { useMemo, useState, useRef } from "react";
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
  format,
  differenceInDays,
  addDays,
  addMonths,
  isWithinInterval,
  min,
  max,
} from "date-fns";
import { cn } from "@/lib/utils";
import { TimelineInitiative } from "@/pages/Timeline";
import { ZoomLevel } from "@/components/timeline/TimelineFilters";
import { Task } from "@/hooks/useTasks";
import { Initiative, useInitiatives } from "@/hooks/useInitiatives";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";
import { TimelineRow } from "./TimelineRow";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface TimelineChartProps {
  initiatives: TimelineInitiative[];
  zoomLevel: ZoomLevel;
  canDragInitiative: (initiative: Initiative) => boolean;
  canDragTask: (
    task: Task & { initiative: { id: string; organization_id: string } },
    initiative: Initiative
  ) => boolean;
  onInitiativeClick: (initiative: Initiative) => void;
  onTaskClick: (task: Task & { initiative: { id: string; organization_id: string } }) => void;
}

export function TimelineChart({
  initiatives,
  zoomLevel,
  canDragInitiative,
  canDragTask,
  onInitiativeClick,
  onTaskClick,
}: TimelineChartProps) {
  const { toast } = useToast();
  const { updateInitiative } = useInitiatives();
  const containerRef = useRef<HTMLDivElement>(null);

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
      case "week":
        // Each column = 1 week
        start = startOfWeek(addDays(minDate, -14), { weekStartsOn: 1 });
        end = endOfWeek(addDays(maxDate, 14), { weekStartsOn: 1 });
        cols = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
        colWidth = 100;
        break;
      case "month":
        // Each column = 1 month
        start = startOfMonth(addMonths(minDate, -1));
        end = endOfMonth(addMonths(maxDate, 1));
        cols = eachMonthOfInterval({ start, end });
        colWidth = 120;
        break;
      case "quarter":
        // Each column = 1 quarter
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

  const handleInitiativeDrag = async (
    initiativeId: string,
    newStartDate: string | null,
    newEndDate: string | null
  ) => {
    // Validate dates
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
    // This will be handled by a child component that has access to the correct useTasks hook
  };

  const formatColumnHeader = (date: Date): string => {
    switch (zoomLevel) {
      case "week":
        return format(date, "MMM d"); // "Jan 6"
      case "month":
        return format(date, "MMM yyyy"); // "Jan 2026"
      case "quarter":
        return `Q${Math.ceil((date.getMonth() + 1) / 3)} ${format(date, "yyyy")}`; // "Q1 2026"
    }
  };

  const isTodayInColumn = (columnDate: Date): boolean => {
    const today = new Date();
    switch (zoomLevel) {
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

  const todayPosition = getPositionForDate(new Date());
  const isTodayVisible = isWithinInterval(new Date(), { start: startDate, end: endDate });

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <ScrollArea className="w-full">
        <div className="min-w-max" ref={containerRef}>
          {/* Header row with dates */}
          <div className="flex border-b bg-muted/50 sticky top-0 z-10">
            <div className="w-64 min-w-64 p-3 font-medium border-r sticky left-0 bg-muted z-30">
              Item
            </div>
            <div className="flex relative">
              {columns.map((col, index) => (
                <div
                  key={index}
                  style={{ width: columnWidth }}
                  className={cn(
                    "p-2 text-center text-xs font-medium border-r bg-muted/50",
                    isTodayInColumn(col) && "bg-primary/10"
                  )}
                >
                  {formatColumnHeader(col)}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline rows */}
          <div className="relative">
            {/* Today indicator line */}
            {isTodayVisible && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
                style={{ left: 256 + todayPosition }}
              />
            )}

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
              />
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
