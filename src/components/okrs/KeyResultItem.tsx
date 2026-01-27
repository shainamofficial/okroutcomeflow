import { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, User, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KeyResult } from "@/hooks/useOKRs";
import { useKRMetricConfig, useKRMetricValues, calculateProgress } from "@/hooks/useKRMetrics";
import { useAuth } from "@/contexts/AuthContext";
import { CreateKeyResultDialog } from "./CreateKeyResultDialog";
import { EditKeyResultDialog } from "./EditKeyResultDialog";
import { DeleteKeyResultDialog } from "./DeleteKeyResultDialog";
import { KRDetailPanel } from "./KRDetailPanel";
import { KRStatusBadge } from "./KRStatusBadge";
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
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const { profile, roles } = useAuth();
  const { toast } = useToast();

  const { config } = useKRMetricConfig(keyResult.id);
  const { values } = useKRMetricValues(config?.id);
  const progress = calculateProgress(config, values);

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

        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setShowDetailPanel(true)}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm hover:underline">{keyResult.title}</span>
            <KRStatusBadge status={progress.status} />
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
          {progress.status !== "no_config" && progress.status !== "no_data" && (
            <div className="mt-1 w-full max-w-[200px] h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.round(progress.progressPercent * 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowDetailPanel(true)}
            title="View metrics"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
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

      <KRDetailPanel
        keyResult={keyResult}
        open={showDetailPanel}
        onOpenChange={setShowDetailPanel}
      />
    </div>
  );
}
