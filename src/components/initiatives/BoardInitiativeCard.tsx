import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, User, Calendar, Target, ListTodo, ChevronDown, ChevronUp } from "lucide-react";
import { Initiative, useInitiativeKRLinks } from "@/hooks/useInitiatives";
import { useAuth } from "@/contexts/AuthContext";
import { InitiativeStatusBadge } from "./InitiativeStatusBadge";
import { EditInitiativeDialog } from "./EditInitiativeDialog";
import { DeleteInitiativeDialog } from "./DeleteInitiativeDialog";
import { InitiativeDetailDrawer } from "./InitiativeDetailDrawer";
import { BoardTaskRow } from "./BoardTaskRow";
import { format } from "date-fns";
import { useTasks } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface BoardInitiativeCardProps {
  initiative: Initiative;
  canDrag: boolean;
}

export function BoardInitiativeCard({ initiative, canDrag }: BoardInitiativeCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const { profile, roles } = useAuth();
  const { links } = useInitiativeKRLinks(initiative.id);
  const { tasks } = useTasks(initiative.id);

  const canManage = roles.includes("admin") || roles.includes("manager");
  const isOwner = initiative.owner_id === profile?.id;
  const canEdit = canManage || isOwner;

  const doneTasks = tasks.filter((t) => t.status === "done").length;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("initiative-id", initiative.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <>
      <Collapsible open={tasksOpen} onOpenChange={setTasksOpen}>
        <Card
          draggable={canDrag}
          onDragStart={handleDragStart}
          className={cn(
            "transition-colors",
            canDrag && "cursor-grab active:cursor-grabbing"
          )}
        >
          <CardHeader className="p-3 pb-1">
            <div className="flex items-start justify-between gap-1">
              <CardTitle
                className="text-sm cursor-pointer hover:underline flex-1 min-w-0 truncate"
                onClick={() => setShowDetail(true)}
              >
                {initiative.title}
              </CardTitle>
              <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                {canEdit && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowEdit(true)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
                {canManage && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setShowDelete(true)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1.5">
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {initiative.owner && (
                <span className="flex items-center gap-1"><User className="h-3 w-3" />{initiative.owner.name || initiative.owner.email}</span>
              )}
              {initiative.end_date && (
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(initiative.end_date), "MMM d")}</span>
              )}
              {links.length > 0 && (
                <span className="flex items-center gap-1"><Target className="h-3 w-3" />{links.length} KR{links.length !== 1 ? "s" : ""}</span>
              )}
              {tasks.length > 0 && (
                <span className="flex items-center gap-1"><ListTodo className="h-3 w-3" />{doneTasks}/{tasks.length}</span>
              )}
            </div>

            {tasks.length > 0 && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-full text-xs px-1" onClick={(e) => e.stopPropagation()}>
                  {tasksOpen ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                  Tasks
                </Button>
              </CollapsibleTrigger>
            )}
          </CardContent>
          <CollapsibleContent>
            <BoardTaskRow initiativeId={initiative.id} />
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {showEdit && (
        <EditInitiativeDialog initiative={initiative} open={showEdit} onOpenChange={setShowEdit} />
      )}
      <DeleteInitiativeDialog initiative={initiative} open={showDelete} onOpenChange={setShowDelete} />
      <InitiativeDetailDrawer initiative={initiative} open={showDetail} onOpenChange={setShowDetail} />
    </>
  );
}
