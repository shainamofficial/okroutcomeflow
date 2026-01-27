import { Badge } from "@/components/ui/badge";
import { InitiativeStatus } from "@/hooks/useInitiatives";

const statusConfig: Record<
  InitiativeStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  not_started: { label: "Not Started", variant: "outline" },
  in_progress: { label: "In Progress", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  blocked: { label: "Blocked", variant: "destructive" },
};

interface InitiativeStatusBadgeProps {
  status: InitiativeStatus;
}

export function InitiativeStatusBadge({ status }: InitiativeStatusBadgeProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
