import { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Objective, KeyResult } from "@/hooks/useOKRs";
import { useAuth } from "@/contexts/AuthContext";
import { EditObjectiveDialog } from "./EditObjectiveDialog";
import { DeleteObjectiveDialog } from "./DeleteObjectiveDialog";
import { CreateKeyResultDialog } from "./CreateKeyResultDialog";
import { KeyResultItem } from "./KeyResultItem";

interface ObjectiveCardProps {
  objective: Objective;
  keyResults: KeyResult[];
}

export function ObjectiveCard({ objective, keyResults }: ObjectiveCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddKRDialog, setShowAddKRDialog] = useState(false);
  const { roles } = useAuth();

  const canManage = roles.includes("admin") || roles.includes("manager");

  // Get L1 Key Results (those directly under this objective)
  const l1KeyResults = keyResults.filter((kr) => kr.objective_id === objective.id);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 mt-0.5"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary shrink-0" />
              <h3 className="font-semibold text-lg">{objective.title}</h3>
            </div>
            {objective.description && (
              <p className="text-muted-foreground mt-1 ml-7">{objective.description}</p>
            )}
          </div>

          {canManage && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowAddKRDialog(true)}
                title="Add Key Result"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowEditDialog(true)}
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {isExpanded && l1KeyResults.length > 0 && (
          <div className="mt-4 ml-8">
            {l1KeyResults.map((kr) => (
              <KeyResultItem
                key={kr.id}
                keyResult={kr}
                allKeyResults={keyResults}
                level={1}
              />
            ))}
          </div>
        )}

        {isExpanded && l1KeyResults.length === 0 && (
          <div className="mt-4 ml-8 text-sm text-muted-foreground">
            No Key Results yet.{" "}
            {canManage && (
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => setShowAddKRDialog(true)}
              >
                Add one
              </Button>
            )}
          </div>
        )}

        <EditObjectiveDialog
          objective={objective}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />

        <DeleteObjectiveDialog
          objective={objective}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
        />

        <CreateKeyResultDialog
          objectiveId={objective.id}
          open={showAddKRDialog}
          onOpenChange={setShowAddKRDialog}
        />
      </CardContent>
    </Card>
  );
}
