import { Badge } from "@/components/ui/badge";
import { MessageSquare, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type UpdateKind = Database["public"]["Enums"]["update_kind"];

interface UpdateKindBadgeProps {
  kind: UpdateKind;
}

const kindConfig: Record<UpdateKind, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  comment: {
    label: "Comment",
    variant: "secondary",
    icon: MessageSquare,
  },
  progress: {
    label: "Progress",
    variant: "default",
    icon: TrendingUp,
  },
  blocker: {
    label: "Blocker",
    variant: "destructive",
    icon: AlertTriangle,
  },
  decision: {
    label: "Decision",
    variant: "outline",
    icon: CheckCircle,
  },
};

export function UpdateKindBadge({ kind }: UpdateKindBadgeProps) {
  const config = kindConfig[kind];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="text-xs gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
