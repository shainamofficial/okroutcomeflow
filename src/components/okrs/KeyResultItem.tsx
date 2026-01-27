import { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KeyResult } from "@/hooks/useOKRs";
import { useAuth } from "@/contexts/AuthContext";
import { CreateKeyResultDialog } from "./CreateKeyResultDialog";
import { EditKeyResultDialog } from "./EditKeyResultDialog";
import { DeleteKeyResultDialog } from "./DeleteKeyResultDialog";
import { useToast } from "@/hooks/use-toast";

interface KeyResultItemProps {
  keyResult: KeyResult;
  allKeyResults: KeyResult[];
  level: number;
}

export function KeyResultItem({ keyResult, allKeyResults, level }: KeyResultItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddKR, setShowAddKR] = useState(false);
  const [showEditKR, setShowEditKR] = useState(false);
  const [showDeleteKR, setShowDeleteKR] = useState(false);
  const { profile, roles } = useAuth();
  const { toast } = useToast();

  const childKRs = allKeyResults.filter((kr) => kr.parent_kr_id === keyResult.id);
  const hasChildren = childKRs.length > 0;

  const canManage = roles.includes("admin") || roles.includes("manager");
  const isOwner = keyResult.owner_id === profile?.id;
  const canEdit = canManage || (roles.includes("contributor") && isOwner);

  const handleEditClick = () => {
    if (!canEdit) {
      toast({
        title: "No access",
        description: "You can only edit Key Results that you own.",
        variant: "destructive",
      });
      return;
    }
    setShowEditKR(true);
  };

  return (
    <div className="border-l-2 border-muted ml-4 pl-4">
      <div className="flex items-start gap-2 py-2 group">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <div className="h-4 w-4" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{keyResult.title}</span>
            {keyResult.owner && (
              <Badge variant="secondary" className="text-xs">
                <User className="h-3 w-3 mr-1" />
                {keyResult.owner.name || keyResult.owner.email}
              </Badge>
            )}
          </div>
          {keyResult.description && (
            <p className="text-sm text-muted-foreground mt-1">{keyResult.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canManage && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowAddKR(true)}
              title="Add sub Key Result"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleEditClick}
            title={canEdit ? "Edit" : "No access"}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {canManage && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => setShowDeleteKR(true)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {childKRs.map((childKR) => (
            <KeyResultItem
              key={childKR.id}
              keyResult={childKR}
              allKeyResults={allKeyResults}
              level={level + 1}
            />
          ))}
        </div>
      )}

      <CreateKeyResultDialog
        parentKrId={keyResult.id}
        open={showAddKR}
        onOpenChange={setShowAddKR}
      />

      {showEditKR && (
        <EditKeyResultDialog
          keyResult={keyResult}
          open={showEditKR}
          onOpenChange={setShowEditKR}
        />
      )}

      <DeleteKeyResultDialog
        keyResult={keyResult}
        hasChildren={hasChildren}
        open={showDeleteKR}
        onOpenChange={setShowDeleteKR}
      />
    </div>
  );
}
