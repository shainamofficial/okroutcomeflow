import { useObjectives, useAllKeyResults } from "@/hooks/useOKRs";
import { useAuth } from "@/contexts/AuthContext";
import { CreateObjectiveDialog } from "@/components/okrs/CreateObjectiveDialog";
import { ObjectiveCard } from "@/components/okrs/ObjectiveCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";

export default function OKRs() {
  const { objectives, isLoading: objectivesLoading } = useObjectives();
  const { keyResults, isLoading: keyResultsLoading } = useAllKeyResults();
  const { roles } = useAuth();

  const canManage = roles.includes("admin") || roles.includes("manager");
  const isLoading = objectivesLoading || keyResultsLoading;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Objectives & Key Results</h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization's objectives and track progress
          </p>
        </div>
        {canManage && <CreateObjectiveDialog />}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : objectives.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-accent-foreground" />
          </div>
          <h2 className="text-xl font-bold font-display">No objectives yet</h2>
          <p className="text-muted-foreground mt-1 max-w-sm">
            {canManage
              ? "Create your first objective to get started."
              : "No objectives have been created yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {objectives.map((objective) => (
            <ObjectiveCard
              key={objective.id}
              objective={objective}
              keyResults={keyResults}
            />
          ))}
        </div>
      )}
    </div>
  );
}
