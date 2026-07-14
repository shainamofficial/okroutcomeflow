import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ReviewSessionStatus } from "@/hooks/useReviews";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  ReviewSessionStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
    explanation: string;
  }
> = {
  scheduled: {
    label: "Scheduled",
    variant: "info",
    explanation:
      "A planned review instance created by a Cadence. The KR owner should submit progress before this date; managers review it together.",
  },
  completed: {
    label: "Completed",
    variant: "success",
    explanation:
      "This review session happened and notes/updates were recorded. The next session has already been scheduled by the cadence.",
  },
  cancelled: {
    label: "Cancelled",
    variant: "destructive",
    explanation:
      "This specific session was skipped. The recurring cadence is unaffected — the next session will still fire on schedule.",
  },
};

interface ReviewStatusBadgeProps {
  status: ReviewSessionStatus;
  className?: string;
}

export function ReviewStatusBadge({ status, className }: ReviewStatusBadgeProps) {
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
