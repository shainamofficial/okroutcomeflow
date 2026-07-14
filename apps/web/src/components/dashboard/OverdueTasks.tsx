import { format } from "date-fns";
import { AlertTriangle, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OverdueTask } from "@/hooks/useDashboardStats";

interface OverdueTasksProps {
  tasks: OverdueTask[];
  isLoading?: boolean;
}

export function OverdueTasks({ tasks, isLoading }: OverdueTasksProps) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 font-display">
          <div className="h-6 w-6 rounded-md bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
          </div>
          Overdue Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No overdue tasks 🎉</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{task.title}</p>
                  {task.assignee_user && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.assignee_user.name || task.assignee_user.email}
                    </p>
                  )}
                </div>
                <Badge variant="destructive" className="text-xs">
                  Due {format(new Date(task.due_date), "MMM d")}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
