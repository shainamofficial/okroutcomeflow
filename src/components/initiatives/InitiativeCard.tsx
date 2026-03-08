import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, User, Calendar, Target, ListTodo } from "lucide-react";
import { Initiative, useInitiativeKRLinks } from "@/hooks/useInitiatives";
import { useAuth } from "@/contexts/AuthContext";
import { InitiativeStatusBadge } from "./InitiativeStatusBadge";
import { EditInitiativeDialog } from "./EditInitiativeDialog";
import { DeleteInitiativeDialog } from "./DeleteInitiativeDialog";
import { InitiativeDetailDrawer } from "./InitiativeDetailDrawer";
import { format } from "date-fns";
import { useTasks } from "@/hooks/useTasks";
import { InitiativeProgressBar } from "./InitiativeProgressBar";

interface InitiativeCardProps {
  initiative: Initiative;
}

export function InitiativeCard({ initiative }: InitiativeCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const { profile, roles } = useAuth();
  const { links } = useInitiativeKRLinks(initiative.id);
  const { tasks } = useTasks(initiative.id);

  const canManage = roles.includes("admin") || roles.includes("manager");
  const isOwner = initiative.owner_id === profile?.id;
  const canEdit = canManage || isOwner;

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-card-hover border-border/60 transition-all duration-200 group"
        onClick={() => setShowDetail(true)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-display flex items-center gap-2.5 flex-wrap">
                {initiative.title}
                <InitiativeStatusBadge status={initiative.status} />
              </CardTitle>
            </div>
            <div
              className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              {canEdit && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowEdit(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              {canManage && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setShowDelete(true)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.length > 0 && (
            <InitiativeProgressBar
              total={tasks.length}
              done={tasks.filter((t) => t.status === "done").length}
            />
          )}
          {initiative.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {initiative.description}
            </p>
          )}

          <div className="flex flex-wrap gap-3 text-sm">
            {initiative.owner && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span className="text-xs">{initiative.owner.name || initiative.owner.email}</span>
              </div>
            )}
            {(initiative.start_date || initiative.end_date) && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs">
                  {initiative.start_date && format(new Date(initiative.start_date), "MMM d")}
                  {initiative.start_date && initiative.end_date && " – "}
                  {initiative.end_date && format(new Date(initiative.end_date), "MMM d, yyyy")}
                </span>
              </div>
            )}
            {links.length > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                <span className="text-xs">{links.length} Key Result{links.length !== 1 ? "s" : ""}</span>
              </div>
            )}
            {tasks.length > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <ListTodo className="h-3.5 w-3.5" />
                <span className="text-xs">{tasks.length} Task{tasks.length !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          {links.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {links.slice(0, 3).map((link) => (
                <Badge key={link.id} variant="secondary" className="text-[10px] font-medium">
                  {link.key_result?.title}
                </Badge>
              ))}
              {links.length > 3 && (
                <Badge variant="outline" className="text-[10px]">
                  +{links.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showEdit && (
        <EditInitiativeDialog initiative={initiative} open={showEdit} onOpenChange={setShowEdit} />
      )}
      <DeleteInitiativeDialog initiative={initiative} open={showDelete} onOpenChange={setShowDelete} />
      <InitiativeDetailDrawer initiative={initiative} open={showDetail} onOpenChange={setShowDetail} />
    </>
  );
}
