import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface InitiativeStatusChartProps {
  distribution: {
    not_started: number;
    in_progress: number;
    completed: number;
    blocked: number;
  };
}

const STATUS_COLORS: Record<string, string> = {
  not_started: "hsl(var(--muted-foreground))",
  in_progress: "hsl(var(--info))",
  completed: "hsl(var(--success))",
  blocked: "hsl(var(--destructive))",
};

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  blocked: "Blocked",
};

export function InitiativeStatusChart({ distribution }: InitiativeStatusChartProps) {
  const data = Object.entries(distribution)
    .filter(([_, v]) => v > 0)
    .map(([key, value]) => ({ name: STATUS_LABELS[key], value, color: STATUS_COLORS[key] }));

  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-display">Initiative Status</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No initiatives yet</p>
        ) : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={2}>
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5">
              {data.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="font-semibold">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
