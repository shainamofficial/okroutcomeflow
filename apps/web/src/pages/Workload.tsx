import { useMemo } from "react";
import { useAllTasks } from "@/hooks/useTasks";
import { useOrgUsers } from "@/hooks/useOrgUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserWorkload {
  userId: string;
  name: string;
  email: string;
  todo: number;
  inProgress: number;
  blocked: number;
  done: number;
  total: number;
  overdue: number;
}

export default function Workload() {
  const { tasks } = useAllTasks();
  const { users } = useOrgUsers();

  const workloads = useMemo(() => {
    const map: Record<string, UserWorkload> = {};

    tasks.forEach((task) => {
      const uid = task.assignee_user_id;
      if (!uid) return;

      if (!map[uid]) {
        const user = users.find((u) => u.id === uid);
        map[uid] = {
          userId: uid,
          name: user?.name || "Unknown",
          email: user?.email || "",
          todo: 0,
          inProgress: 0,
          blocked: 0,
          done: 0,
          total: 0,
          overdue: 0,
        };
      }

      map[uid].total++;
      if (task.status === "todo") map[uid].todo++;
      else if (task.status === "in_progress") map[uid].inProgress++;
      else if (task.status === "blocked") map[uid].blocked++;
      else if (task.status === "done") map[uid].done++;

      if (task.due_date && task.status !== "done" && new Date(task.due_date) < new Date()) {
        map[uid].overdue++;
      }
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [tasks, users]);

  const unassignedCount = tasks.filter((t) => !t.assignee_user_id).length;
  const maxTasks = Math.max(...workloads.map((w) => w.total), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold font-display">Workload</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base hidden sm:block">See how tasks are distributed across your team</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.filter((t) => t.assignee_user_id).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unassigned Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unassignedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workloads.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Workload bars */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Users className="h-4 w-4" />
            Task Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {workloads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No assigned tasks yet.</p>
          ) : (
            workloads.map((w) => (
              <div key={w.userId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {w.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm font-medium">{w.name || w.email}</span>
                      {w.overdue > 0 && (
                        <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0">
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                          {w.overdue} overdue
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{w.total} tasks</span>
                </div>

                {/* Stacked bar */}
                <div className="flex h-3 rounded-full overflow-hidden bg-muted/40">
                  {w.done > 0 && (
                    <div
                      className="bg-[hsl(var(--success))] transition-all"
                      style={{ width: `${(w.done / maxTasks) * 100}%` }}
                      title={`${w.done} done`}
                    />
                  )}
                  {w.inProgress > 0 && (
                    <div
                      className="bg-[hsl(var(--info))] transition-all"
                      style={{ width: `${(w.inProgress / maxTasks) * 100}%` }}
                      title={`${w.inProgress} in progress`}
                    />
                  )}
                  {w.todo > 0 && (
                    <div
                      className="bg-[hsl(var(--warning))] transition-all"
                      style={{ width: `${(w.todo / maxTasks) * 100}%` }}
                      title={`${w.todo} todo`}
                    />
                  )}
                  {w.blocked > 0 && (
                    <div
                      className="bg-[hsl(var(--destructive))] transition-all"
                      style={{ width: `${(w.blocked / maxTasks) * 100}%` }}
                      title={`${w.blocked} blocked`}
                    />
                  )}
                </div>

                <div className="flex gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-[hsl(var(--success))]" /> {w.done} done
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-[hsl(var(--info))]" /> {w.inProgress} in progress
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-[hsl(var(--warning))]" /> {w.todo} todo
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-[hsl(var(--destructive))]" /> {w.blocked} blocked
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
