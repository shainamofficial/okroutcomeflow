import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface KRStatusChartProps {
  distribution: {
    onTrack: number;
    atRisk: number;
    behind: number;
    noData: number;
  };
}

const COLORS = {
  onTrack: "hsl(var(--chart-2))",
  atRisk: "hsl(var(--chart-4))",
  behind: "hsl(var(--chart-1))",
  noData: "hsl(var(--chart-5))",
};

export function KRStatusChart({ distribution }: KRStatusChartProps) {
  const data = [
    { name: "On Track", value: distribution.onTrack, color: COLORS.onTrack },
    { name: "At Risk", value: distribution.atRisk, color: COLORS.atRisk },
    { name: "Behind", value: distribution.behind, color: COLORS.behind },
    { name: "No Data", value: distribution.noData, color: COLORS.noData },
  ].filter((d) => d.value > 0);

  const total = distribution.onTrack + distribution.atRisk + distribution.behind + distribution.noData;

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">KR Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground text-sm">No Key Results yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">KR Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} KRs`, ""]}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
