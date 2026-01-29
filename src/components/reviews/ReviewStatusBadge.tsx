import { Badge } from "@/components/ui/badge";
import { ReviewSessionStatus } from "@/hooks/useReviews";

const statusConfig: Record<ReviewSessionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  scheduled: { label: "Scheduled", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

interface ReviewStatusBadgeProps {
  status: ReviewSessionStatus;
}

export function ReviewStatusBadge({ status }: ReviewStatusBadgeProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
