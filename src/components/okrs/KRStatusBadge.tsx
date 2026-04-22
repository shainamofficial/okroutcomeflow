import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { KRStatus } from "@/hooks/useKRMetrics";
import { cn } from "@/lib/utils";

interface KRStatusBadgeProps {
  status: KRStatus;
  className?: string;
}

const statusConfig: Record<
  KRStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
    explanation: string;
  }
> = {
  no_config: {
    label: "No Config",
    variant: "outline",
    explanation:
      "This KR has no metric configured yet. Click it and set up a metric (name, unit, start, target, dates) to start tracking progress.",
  },
  no_data: {
    label: "No Data",
    variant: "secondary",
    explanation:
      "Metric is configured but no values have been logged yet. Add a metric value to see progress and status.",
  },
  on_track: {
    label: "On Track",
    variant: "success",
    explanation:
      "Today's value is at or above the expected line for this date. At this pace, the KR will hit its target by the end date.",
  },
  at_risk: {
    label: "At Risk",
    variant: "warning",
    explanation:
      "Behind the expected pace, but recoverable. Action is needed soon or this KR will slip into Off Track.",
  },
  off_track: {
    label: "Off Track",
    variant: "destructive",
    explanation:
      "Significantly behind the expected pace. Without intervention or a target change, this KR will not hit its goal.",
  },
};

export function KRStatusBadge({ status, className }: KRStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className={cn("cursor-help", className)}>
          {config.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">
        <p className="font-medium">{config.label}</p>
        <p className="text-muted-foreground">{config.explanation}</p>
      </TooltipContent>
    </Tooltip>
  );
}
