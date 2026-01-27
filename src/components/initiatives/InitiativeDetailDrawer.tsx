import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Calendar, Target } from "lucide-react";
import { Initiative, useInitiativeKRLinks } from "@/hooks/useInitiatives";
import { InitiativeStatusBadge } from "./InitiativeStatusBadge";
import { TaskList } from "@/components/tasks/TaskList";
import { useAuth } from "@/contexts/AuthContext";

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
  const { roles } = useAuth();
  
  const canManage = roles.includes("admin") || roles.includes("manager");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 flex-wrap">
            {initiative.title}
            <InitiativeStatusBadge status={initiative.status} />
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
            ) : links.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No Key Results linked to this initiative.
              </p>
            ) : (
              <div className="space-y-2">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className="p-3 border rounded-md bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium">
                        {link.key_result?.title}
                      </span>
                      {link.weight !== null && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          Weight: {link.weight}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <TaskList
            initiativeId={initiative.id}
            initiativeOwnerId={initiative.owner_id}
            canManage={canManage}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
