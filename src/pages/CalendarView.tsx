import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";
import { useAllTasks } from "@/hooks/useTasks";
import { useInitiatives } from "@/hooks/useInitiatives";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { InitiativeStatusBadge } from "@/components/initiatives/InitiativeStatusBadge";

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { tasks } = useAllTasks();
  const { initiatives } = useInitiatives();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks.forEach((t) => {
      if (t.due_date) {
        const key = format(new Date(t.due_date), "yyyy-MM-dd");
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    });
    return map;
  }, [tasks]);

  const initiativesByDate = useMemo(() => {
    const map: Record<string, typeof initiatives> = {};
    initiatives.forEach((i) => {
      if (i.end_date) {
        const key = format(new Date(i.end_date), "yyyy-MM-dd");
        if (!map[key]) map[key] = [];
        map[key].push(i);
      }
    });
    return map;
  }, [initiatives]);

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold font-display">Calendar</h1>
          <p className="text-muted-foreground mt-1 text-sm hidden sm:block">View tasks and initiatives by due date</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Today
          </Button>
          <h2 className="text-sm sm:text-lg font-semibold font-display min-w-[120px] sm:min-w-[160px] text-center">
            {format(currentMonth, "MMM yyyy")}
          </h2>
          <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b bg-muted/30">
            {weekDays.map((day) => (
              <div key={day} className="p-2 text-center text-xs font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayTasks = tasksByDate[key] || [];
              const dayInitiatives = initiativesByDate[key] || [];
              const hasItems = dayTasks.length > 0 || dayInitiatives.length > 0;

              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-[60px] sm:min-h-[100px] border-b border-r p-1 sm:p-1.5 transition-colors",
                    !isSameMonth(day, currentMonth) && "bg-muted/20 text-muted-foreground/50",
                    isToday(day) && "bg-accent/30"
                  )}
                >
                  <div className={cn(
                    "text-xs font-medium mb-1 h-5 w-5 flex items-center justify-center rounded-full",
                    isToday(day) && "bg-primary text-primary-foreground"
                  )}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5 overflow-hidden max-h-[72px]">
                    {dayInitiatives.slice(0, 2).map((i) => (
                      <div key={i.id} className="text-[10px] px-1 py-0.5 rounded bg-accent/60 text-accent-foreground truncate font-medium">
                        🎯 {i.title}
                      </div>
                    ))}
                    {dayTasks.slice(0, 3 - dayInitiatives.length).map((t) => (
                      <div
                        key={t.id}
                        className={cn(
                          "text-[10px] px-1 py-0.5 rounded truncate",
                          t.status === "done" ? "bg-success/10 text-success line-through" :
                          t.status === "blocked" ? "bg-destructive/10 text-destructive" :
                          "bg-muted text-muted-foreground"
                        )}
                      >
                        {t.title}
                      </div>
                    ))}
                    {(dayTasks.length + dayInitiatives.length > 3) && (
                      <div className="text-[10px] text-muted-foreground pl-1">
                        +{dayTasks.length + dayInitiatives.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
