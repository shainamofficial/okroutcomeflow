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
  progress: { icon: TrendingUp, label: "Progress", variant: "info" as const },
  blocker: { icon: AlertOctagon, label: "Blocker", variant: "destructive" as const },
  decision: { icon: Gavel, label: "Decision", variant: "outline" as const },
};

export function RecentUpdates({ updates, isLoading }: RecentUpdatesProps) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base font-display">Recent Updates</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : updates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent updates</p>
        ) : (
          <div className="space-y-2">
            {updates.map((update) => {
              const config = UPDATE_KIND_CONFIG[update.update_kind as keyof typeof UPDATE_KIND_CONFIG];
              const Icon = config?.icon || MessageSquare;
              
              return (
                <div
                  key={update.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/40"
                >
                  <div className="h-7 w-7 rounded-md bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="h-3.5 w-3.5 text-accent-foreground" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm line-clamp-2">{update.content}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{update.user?.name || update.user?.email || "Unknown"}</span>
                      <span>·</span>
                      <span>
                        {formatDistanceToNow(new Date(update.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  <Badge variant={config?.variant || "secondary"} className="text-[10px]">
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
