import { useState } from "react";
import { format, isPast, isToday, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, List, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAllReviewSessions, ReviewSession } from "@/hooks/useReviews";
import { ReviewStatusBadge } from "@/components/reviews/ReviewStatusBadge";
import { ReviewSessionDrawer } from "@/components/reviews/ReviewSessionDrawer";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

export default function Reviews() {
  const { sessions, isLoading } = useAllReviewSessions();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<ReviewSession | null>(null);
  const [view, setView] = useState<"calendar" | "list">("list");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getSessionsForDay = (day: Date) => {
    return sessions.filter((s) => isSameDay(new Date(s.review_date), day));
  };

  const upcomingSessions = sessions.filter(
    (s) => s.status === "scheduled" && !isPast(new Date(s.review_date))
  );

  const overdueSessions = sessions.filter(
    (s) =>
      s.status === "scheduled" &&
      isPast(new Date(s.review_date)) &&
      !isToday(new Date(s.review_date))
  );

  const todaySessions = sessions.filter(
    (s) => s.status === "scheduled" && isToday(new Date(s.review_date))
  );

  const completedSessions = sessions.filter((s) => s.status === "completed");

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth(direction === "prev" ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold inline-flex items-center">
          Reviews
          <InfoTooltip iconSize={16} className="ml-2">
            A <strong>Cadence</strong> is a recurring rule — e.g., "every Monday at 10am". Each
            time the rule fires, it creates a <strong>Session</strong> (one specific review
            instance). Owners submit updates; managers review them together.
          </InfoTooltip>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base hidden sm:block">
          Schedule recurring check-ins where KR owners report progress.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg">
          <div className="text-2xl font-bold text-destructive">{overdueSessions.length}</div>
          <div className="text-sm text-muted-foreground">Overdue</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-2xl font-bold text-primary">{todaySessions.length}</div>
          <div className="text-sm text-muted-foreground">Today</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-2xl font-bold">{upcomingSessions.length}</div>
          <div className="text-sm text-muted-foreground">Upcoming</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-2xl font-bold text-muted-foreground">{completedSessions.length}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as "calendar" | "list")}>
        <TabsList>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            List
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Overdue */}
          {overdueSessions.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-destructive flex items-center gap-2">
                Overdue ({overdueSessions.length})
              </h2>
              <div className="space-y-2">
                {overdueSessions.map((session) => (
                  <SessionListItem
                    key={session.id}
                    session={session}
                    onClick={() => setSelectedSession(session)}
                    isOverdue
                  />
                ))}
              </div>
            </div>
          )}

          {/* Today */}
          {todaySessions.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-primary">Today ({todaySessions.length})</h2>
              <div className="space-y-2">
                {todaySessions.map((session) => (
                  <SessionListItem
                    key={session.id}
                    session={session}
                    onClick={() => setSelectedSession(session)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          <div className="space-y-3">
            <h2 className="font-semibold">Upcoming ({upcomingSessions.length})</h2>
            {upcomingSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 max-w-2xl">
                No review cadences yet. Reviews turn OKRs from a quarterly planning exercise into
                a weekly discipline. Start with a weekly cadence for your KR owners — it's the #1
                driver of OKR adoption.
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingSessions.map((session) => (
                  <SessionListItem
                    key={session.id}
                    session={session}
                    onClick={() => setSelectedSession(session)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Past */}
          {completedSessions.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-muted-foreground">
                Completed ({completedSessions.length})
              </h2>
              <div className="space-y-2">
                {completedSessions.slice(0, 10).map((session) => (
                  <SessionListItem
                    key={session.id}
                    session={session}
                    onClick={() => setSelectedSession(session)}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month start */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-start-${i}`} className="h-24 p-1" />
              ))}

              {daysInMonth.map((day) => {
                const daySessions = getSessionsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "h-24 p-1 border rounded-md overflow-hidden",
                      !isCurrentMonth && "opacity-50",
                      isCurrentDay && "border-primary"
                    )}
                  >
                    <div className={cn(
                      "text-sm font-medium mb-1",
                      isCurrentDay && "text-primary"
                    )}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5 overflow-y-auto max-h-16">
                      {daySessions.slice(0, 3).map((session) => (
                        <button
                          key={session.id}
                          onClick={() => setSelectedSession(session)}
                          className={cn(
                            "w-full text-left text-xs p-1 rounded truncate",
                            session.status === "scheduled" && "bg-primary/10 text-primary",
                            session.status === "completed" && "bg-muted text-muted-foreground",
                            session.status === "cancelled" && "bg-destructive/10 text-destructive line-through"
                          )}
                        >
                          {session.key_result?.title}
                        </button>
                      ))}
                      {daySessions.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{daySessions.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {selectedSession && (
        <ReviewSessionDrawer
          session={selectedSession}
          open={!!selectedSession}
          onOpenChange={(open) => !open && setSelectedSession(null)}
        />
      )}
    </div>
  );
}

function SessionListItem({
  session,
  onClick,
  isOverdue,
}: {
  session: ReviewSession;
  onClick: () => void;
  isOverdue?: boolean;
}) {
  return (
    <div
      className={cn(
        "p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
        isOverdue && "border-destructive/50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium truncate">{session.key_result?.title}</span>
            <ReviewStatusBadge status={session.status} />
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">Overdue</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(session.review_date), "MMM d, yyyy")}</span>
            </div>
            {session.key_result?.owner && (
              <span>Owner: {session.key_result.owner.name || session.key_result.owner.email}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
