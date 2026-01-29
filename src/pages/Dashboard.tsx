import { Target, Lightbulb, CheckSquare, Flag } from "lucide-react";
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

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: upcomingReviews = [], isLoading: reviewsLoading } = useUpcomingReviews();
  const { data: overdueTasks = [], isLoading: tasksLoading } = useOverdueTasks();
  const { data: recentUpdates = [], isLoading: updatesLoading } = useRecentUpdates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your organization's OKRs and initiatives</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Objectives"
          value={statsLoading ? "..." : stats?.objectivesCount || 0}
          icon={<Flag className="h-4 w-4" />}
        />
        <StatCard
          title="Key Results"
          value={statsLoading ? "..." : stats?.keyResultsCount || 0}
          icon={<Target className="h-4 w-4" />}
        />
        <StatCard
          title="Initiatives"
          value={statsLoading ? "..." : stats?.initiativesCount || 0}
          icon={<Lightbulb className="h-4 w-4" />}
        />
        <StatCard
          title="Tasks"
          value={statsLoading ? "..." : stats?.tasksCount || 0}
          icon={<CheckSquare className="h-4 w-4" />}
        />
      </div>

      {/* Charts and Lists */}
      <div className="grid gap-6 md:grid-cols-2">
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
        <UpcomingReviews reviews={upcomingReviews} isLoading={reviewsLoading} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <OverdueTasks tasks={overdueTasks} isLoading={tasksLoading} />
        <RecentUpdates updates={recentUpdates} isLoading={updatesLoading} />
      </div>
    </div>
  );
}
