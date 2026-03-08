import { Target, Lightbulb, CheckSquare, Flag, TrendingUp } from "lucide-react";
import {
  useDashboardStats,
  useUpcomingReviews,
  useOverdueTasks,
  useRecentUpdates,
} from "@/hooks/useDashboardStats";
import { StatCard } from "@/components/dashboard/StatCard";
import { KRStatusChart } from "@/components/dashboard/KRStatusChart";
import { UpcomingReviews } from "@/components/dashboard/UpcomingReviews";
import { OverdueTasks } from "@/components/dashboard/OverdueTasks";
import { RecentUpdates } from "@/components/dashboard/RecentUpdates";
import { InitiativeStatusChart } from "@/components/dashboard/InitiativeStatusChart";
import { TaskCompletionWidget } from "@/components/dashboard/TaskCompletionWidget";
import { useAuth } from "@/contexts/AuthContext";
import { useInitiatives } from "@/hooks/useInitiatives";
import { useAllTasks } from "@/hooks/useTasks";
import { useMemo } from "react";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: upcomingReviews = [], isLoading: reviewsLoading } = useUpcomingReviews();
  const { data: overdueTasks = [], isLoading: tasksLoading } = useOverdueTasks();
  const { data: recentUpdates = [], isLoading: updatesLoading } = useRecentUpdates();
  const { profile } = useAuth();
  const { initiatives } = useInitiatives();
  const { tasks } = useAllTasks();

  const firstName = profile?.name?.split(" ")[0] || "there";

  const initiativeDistribution = useMemo(() => {
    const dist = { not_started: 0, in_progress: 0, completed: 0, blocked: 0 };
    initiatives.forEach((i) => { dist[i.status]++; });
    return dist;
  }, [initiatives]);

  const taskStats = useMemo(() => {
    let done = 0, inProgress = 0, blocked = 0;
    tasks.forEach((t) => {
      if (t.status === "done") done++;
      else if (t.status === "in_progress") inProgress++;
      else if (t.status === "blocked") blocked++;
    });
    return { total: tasks.length, done, inProgress, blocked };
  }, [tasks]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display">
          Welcome back, {firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's how your organization is tracking today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Objectives"
          value={statsLoading ? "–" : stats?.objectivesCount || 0}
          icon={<Flag className="h-5 w-5" />}
        />
        <StatCard
          title="Key Results"
          value={statsLoading ? "–" : stats?.keyResultsCount || 0}
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          title="Initiatives"
          value={statsLoading ? "–" : stats?.initiativesCount || 0}
          icon={<Lightbulb className="h-5 w-5" />}
        />
        <StatCard
          title="Tasks"
          value={statsLoading ? "–" : stats?.tasksCount || 0}
          icon={<CheckSquare className="h-5 w-5" />}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <KRStatusChart
          distribution={
            stats?.krStatusDistribution || {
              onTrack: 0,
              atRisk: 0,
              behind: 0,
              noData: 0,
            }
          }
        />
        <InitiativeStatusChart distribution={initiativeDistribution} />
        <TaskCompletionWidget {...taskStats} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        <UpcomingReviews reviews={upcomingReviews} isLoading={reviewsLoading} />
        <OverdueTasks tasks={overdueTasks} isLoading={tasksLoading} />
      </div>

      <div className="grid gap-6">
        <RecentUpdates updates={recentUpdates} isLoading={updatesLoading} />
      </div>
    </div>
  );
}
