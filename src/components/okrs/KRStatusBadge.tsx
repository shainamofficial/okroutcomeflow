import { Badge } from "@/components/ui/badge";
import { KRStatus } from "@/hooks/useKRMetrics";
import { cn } from "@/lib/utils";

interface KRStatusBadgeProps {
  status: KRStatus;
  className?: string;
}

const statusConfig: Record<KRStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  no_config: { label: "No Config", variant: "outline" },
  no_data: { label: "No Data", variant: "secondary" },
  on_track: { label: "On Track", variant: "default" },
  at_risk: { label: "At Risk", variant: "secondary" },
  off_track: { label: "Off Track", variant: "destructive" },
};

export function KRStatusBadge({ status, className }: KRStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={cn(
        status === "on_track" && "bg-primary text-primary-foreground",
        status === "at_risk" && "bg-accent text-accent-foreground",
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
