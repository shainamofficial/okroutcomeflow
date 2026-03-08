import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TaskCompletionWidgetProps {
  total: number;
  done: number;
  inProgress: number;
  blocked: number;
}

export function TaskCompletionWidget({ total, done, inProgress, blocked }: TaskCompletionWidgetProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-display">Task Completion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold">{pct}%</span>
          <span className="text-sm text-muted-foreground mb-1">{done}/{total} tasks done</span>
        </div>
        <Progress value={pct} className="h-2" />
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-[hsl(var(--success))]/10 p-2">
            <span className="text-lg font-bold text-[hsl(var(--success))]">{done}</span>
            <p className="text-[10px] text-muted-foreground">Done</p>
          </div>
          <div className="rounded-lg bg-[hsl(var(--info))]/10 p-2">
            <span className="text-lg font-bold text-[hsl(var(--info))]">{inProgress}</span>
            <p className="text-[10px] text-muted-foreground">In Progress</p>
          </div>
          <div className="rounded-lg bg-[hsl(var(--destructive))]/10 p-2">
            <span className="text-lg font-bold text-[hsl(var(--destructive))]">{blocked}</span>
            <p className="text-[10px] text-muted-foreground">Blocked</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
