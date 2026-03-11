import { format } from "date-fns";
import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Calendar, Target, Link, Share2 } from "lucide-react";
import { ShareInitiativeDialog } from "./ShareInitiativeDialog";
import { Initiative, useInitiativeKRLinks } from "@/hooks/useInitiatives";
import { InitiativeStatusBadge } from "./InitiativeStatusBadge";
import { TaskList } from "@/components/tasks/TaskList";
import { useAuth } from "@/contexts/AuthContext";
import { ActivityFeed } from "@/components/updates/ActivityFeed";
import { FileAttachmentsPanel } from "@/components/files/FileAttachmentsPanel";
import { useAllKeyResults, useObjectives } from "@/hooks/useOKRs";
import { getKRNestingLevel, getKRObjectiveId } from "@/lib/kr-hierarchy";
import { cn } from "@/lib/utils";

interface InitiativeDetailDrawerProps {
  initiative: Initiative;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InitiativeDetailDrawer({
  initiative,
  open,
  onOpenChange,
}: InitiativeDetailDrawerProps) {
  const { links, isLoading } = useInitiativeKRLinks(initiative.id);
  const { profile, roles } = useAuth();
  const { keyResults } = useAllKeyResults();
  const { objectives } = useObjectives();

  const canManage = roles.includes("admin") || roles.includes("manager");
  const isOwner = initiative.owner_id === profile?.id;
  const canPostNonComment = canManage || isOwner;
  const canPin = canManage || isOwner;
  const canShare = canManage || isOwner;
  const [shareOpen, setShareOpen] = useState(false);

  // Sort linked KRs by nesting level and group by objective
  const sortedLinks = useMemo(() => {
    return [...links].sort((a, b) => {
      const levelA = getKRNestingLevel(a.key_result_id, keyResults);
      const levelB = getKRNestingLevel(b.key_result_id, keyResults);
      return levelA - levelB;
    });
  }, [links, keyResults]);

  const getObjectiveTitle = (krId: string) => {
    const objId = getKRObjectiveId(krId, keyResults);
    if (!objId) return null;
    return objectives.find((o) => o.id === objId)?.title;
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 flex-wrap">
            {initiative.title}
            <InitiativeStatusBadge status={initiative.status} />
            {canShare && (
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => setShareOpen(true)}>
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                Share
              </Button>
            )}
          </SheetTitle>
          {initiative.description && (
            <SheetDescription>{initiative.description}</SheetDescription>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-3">
            {initiative.owner && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Owner:</span>
                <span>{initiative.owner.name || initiative.owner.email}</span>
              </div>
            )}

            {(initiative.start_date || initiative.end_date) && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Dates:</span>
                <span>
                  {initiative.start_date &&
                    format(new Date(initiative.start_date), "MMM d, yyyy")}
                  {initiative.start_date && initiative.end_date && " - "}
                  {initiative.end_date &&
                    format(new Date(initiative.end_date), "MMM d, yyyy")}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Created:</span>
              <span>
                {format(new Date(initiative.created_at), "MMM d, yyyy")}
              </span>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <h3 className="font-medium">
                Linked Key Results ({links.length})
              </h3>
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : sortedLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No Key Results linked to this initiative.
              </p>
            ) : (
              <div className="space-y-2">
                {sortedLinks.map((link) => {
                  const level = getKRNestingLevel(link.key_result_id, keyResults);
                  const isAutoLinked = link.weight === null && level < Math.max(...sortedLinks.map(l => getKRNestingLevel(l.key_result_id, keyResults)));
                  const objectiveTitle = level === 0 ? getObjectiveTitle(link.key_result_id) : null;

                  return (
                    <div key={link.id}>
                      {level === 0 && objectiveTitle && (
                        <p className="text-xs text-muted-foreground mb-1 mt-2 first:mt-0">
                          {objectiveTitle}
                        </p>
                      )}
                      <div
                        className={cn(
                          "p-3 border rounded-md",
                          isAutoLinked ? "bg-muted/20 border-dashed" : "bg-muted/30"
                        )}
                        style={{ marginLeft: `${level * 12}px` }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {isAutoLinked && (
                              <Link className="h-3 w-3 text-muted-foreground shrink-0" />
                            )}
                            <span className="text-sm font-medium">
                              {link.key_result?.title}
                            </span>
                          </div>
                          {link.weight !== null && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              Weight: {link.weight}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          <TaskList
            initiativeId={initiative.id}
            initiativeOwnerId={initiative.owner_id}
            canManage={canManage}
          />

          <Separator />

          <FileAttachmentsPanel entityType="initiative" entityId={initiative.id} />

          <Separator />

          <ActivityFeed
            entityType="initiative"
            entityId={initiative.id}
            canPostNonComment={canPostNonComment}
            canPin={canPin}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
