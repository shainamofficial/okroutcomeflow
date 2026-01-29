import { Badge } from "@/components/ui/badge";
import { KRStatus } from "@/hooks/useKRMetrics";
import { cn } from "@/lib/utils";

interface KRStatusBadgeProps {
  status: KRStatus;
  className?: string;
}

const statusConfig: Record<KRStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  no_config: { label: "No Config", variant: "outline" },
  no_data: { label: "No Data", variant: "secondary" },
  on_track: { label: "On Track", variant: "success" },
  at_risk: { label: "At Risk", variant: "warning" },
  off_track: { label: "Off Track", variant: "destructive" },
};

export function KRStatusBadge({ status, className }: KRStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
