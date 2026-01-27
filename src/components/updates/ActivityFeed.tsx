import { useState } from "react";
import { MessageSquare, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpdates } from "@/hooks/useUpdates";
import { UpdateComposer } from "./UpdateComposer";
import { UpdateItem } from "./UpdateItem";
import type { Database } from "@/integrations/supabase/types";

type EntityType = Database["public"]["Enums"]["entity_type"];
type UpdateKind = Database["public"]["Enums"]["update_kind"];

interface ActivityFeedProps {
  entityType: EntityType;
  entityId: string;
  canPostNonComment: boolean;
  canPin: boolean;
}

const filterOptions: { value: UpdateKind | "all"; label: string }[] = [
  { value: "all", label: "All Updates" },
  { value: "comment", label: "Comments" },
  { value: "progress", label: "Progress" },
  { value: "blocker", label: "Blockers" },
  { value: "decision", label: "Decisions" },
];

export function ActivityFeed({
  entityType,
  entityId,
  canPostNonComment,
  canPin,
}: ActivityFeedProps) {
  const { data: updates, isLoading } = useUpdates(entityType, entityId);
  const [filter, setFilter] = useState<UpdateKind | "all">("all");

  const filteredUpdates = updates?.filter(
    (update) => filter === "all" || update.update_kind === filter
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-24 w-full" />
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <h3 className="font-medium">Activity ({updates?.length || 0})</h3>
        </div>
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value as UpdateKind | "all")}
        >
          <SelectTrigger className="w-[140px] h-8">
            <Filter className="h-3 w-3 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <UpdateComposer
        entityType={entityType}
        entityId={entityId}
        canPostNonComment={canPostNonComment}
      />

      {filteredUpdates && filteredUpdates.length > 0 ? (
        <div className="space-y-3">
          {filteredUpdates.map((update) => (
            <UpdateItem
              key={update.id}
              update={update}
              entityType={entityType}
              entityId={entityId}
              canPin={canPin}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No updates yet. Be the first to post!
        </p>
      )}
    </div>
  );
}
