import { useMemo } from "react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { KRMetricConfig, KRMetricValue } from "@/hooks/useKRMetrics";

interface MetricChartProps {
  config: KRMetricConfig;
  values: KRMetricValue[];
}

export function MetricChart({ config, values }: MetricChartProps) {
  const chartData = useMemo(() => {
    return [...values]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((v) => ({
        date: format(new Date(v.date), "MMM d"),
        value: v.value,
      }));
  }, [values]);

  if (values.length < 2) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
        Add at least 2 data points to see the chart.
      </div>
    );
  }

  const allValues = values.map((v) => v.value);
  const minValue = Math.min(...allValues, config.start_value, config.target_value);
  const maxValue = Math.max(...allValues, config.start_value, config.target_value);
  const padding = (maxValue - minValue) * 0.1 || 1;

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            domain={[minValue - padding, maxValue + padding]}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            labelStyle={{ color: "hsl(var(--popover-foreground))" }}
          />
          <ReferenceLine
            y={config.target_value}
            stroke="hsl(var(--primary))"
            strokeDasharray="5 5"
            label={{
              value: `Target: ${config.target_value}`,
              position: "right",
              fontSize: 10,
              fill: "hsl(var(--muted-foreground))",
            }}
          />
          <ReferenceLine
            y={config.start_value}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="3 3"
            label={{
              value: `Start: ${config.start_value}`,
              position: "right",
              fontSize: 10,
              fill: "hsl(var(--muted-foreground))",
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
