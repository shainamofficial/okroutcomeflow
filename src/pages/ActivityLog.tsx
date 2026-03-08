import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";
import { MessageSquare, TrendingUp, AlertTriangle, Gavel, Activity } from "lucide-react";
import { UpdateKindBadge } from "@/components/updates/UpdateKindBadge";

export default function ActivityLog() {
  const { profile } = useAuth();

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ["activity-log", profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("updates")
        .select("*, user:users_profile!updates_user_id_fkey(name, email, avatar_url)")
        .eq("organization_id", profile!.organization_id!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold font-display">Activity Log</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base hidden sm:block">Organization-wide feed of all updates and changes</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : updates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <Activity className="h-8 w-8 text-accent-foreground" />
          </div>
          <h2 className="text-xl font-bold font-display">No activity yet</h2>
          <p className="text-muted-foreground mt-1">Updates will appear here as your team makes changes.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {updates.map((update) => (
            <Card key={update.id} className="border-border/60 hover:shadow-card-hover transition-all">
              <CardContent className="p-4 flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-primary">
                    {((update as any).user?.name || (update as any).user?.email || "?").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {(update as any).user?.name || (update as any).user?.email}
                    </span>
                    <UpdateKindBadge kind={update.update_kind} />
                    <Badge variant="outline" className="text-[10px]">
                      {update.entity_type}
                    </Badge>
                    {update.pinned && (
                      <Badge variant="secondary" className="text-[10px]">📌 Pinned</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{update.content}</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
