import { Badge } from "@/components/ui/badge";
import { ReviewSessionStatus } from "@/hooks/useReviews";

const statusConfig: Record<ReviewSessionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  scheduled: { label: "Scheduled", variant: "outline" },
  completed: { label: "Completed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

interface ReviewStatusBadgeProps {
  status: ReviewSessionStatus;
}

export function ReviewStatusBadge({ status }: ReviewStatusBadgeProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
