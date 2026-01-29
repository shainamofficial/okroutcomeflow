import { formatDistanceToNow } from "date-fns";
import { MessageSquare, TrendingUp, AlertOctagon, Gavel } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecentUpdate } from "@/hooks/useDashboardStats";

interface RecentUpdatesProps {
  updates: RecentUpdate[];
  isLoading?: boolean;
}

const UPDATE_KIND_CONFIG = {
  comment: { icon: MessageSquare, label: "Comment", variant: "secondary" as const },
  progress: { icon: TrendingUp, label: "Progress", variant: "default" as const },
  blocker: { icon: AlertOctagon, label: "Blocker", variant: "destructive" as const },
  decision: { icon: Gavel, label: "Decision", variant: "outline" as const },
};

export function RecentUpdates({ updates, isLoading }: RecentUpdatesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Updates (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : updates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent updates</p>
        ) : (
          <div className="space-y-3">
            {updates.map((update) => {
              const config = UPDATE_KIND_CONFIG[update.update_kind as keyof typeof UPDATE_KIND_CONFIG];
              const Icon = config?.icon || MessageSquare;
              
              return (
                <div
                  key={update.id}
                  className="flex items-start gap-3 p-3 rounded-md bg-muted/50"
                >
                  <div className="mt-0.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm line-clamp-2">{update.content}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{update.user?.name || update.user?.email || "Unknown"}</span>
                      <span>·</span>
                      <span>
                        {formatDistanceToNow(new Date(update.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  <Badge variant={config?.variant || "secondary"} className="text-xs">
                    {config?.label || update.update_kind}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
