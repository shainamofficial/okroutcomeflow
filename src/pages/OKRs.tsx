import { type ReactNode } from "react";
import { useObjectives, useAllKeyResults } from "@/hooks/useOKRs";
import { useAuth } from "@/contexts/AuthContext";
import { CreateObjectiveDialog } from "@/components/okrs/CreateObjectiveDialog";
import { ObjectiveCard } from "@/components/okrs/ObjectiveCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Flag, CheckCircle2 } from "lucide-react";

function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}

function EmptyState({ canManage }: { canManage: boolean }) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-8 sm:p-10">
      <div className="flex flex-col items-center text-center">
        <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
          <Target className="h-7 w-7 text-accent-foreground" />
        </div>
        <h2 className="text-xl font-bold font-display">No objectives yet</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          OKRs connect company strategy to daily work. Set a few ambitious{" "}
          <strong className="text-foreground">Objectives</strong> for the cycle, then define 3–5 measurable{" "}
          <strong className="text-foreground">Key Results</strong> under each.
        </p>
      </div>

      <div className="mt-6 rounded-lg border bg-muted/30 p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Flag className="h-3.5 w-3.5" />
          Example
        </div>
        <div className="flex items-start gap-2">
          <Flag className="h-4 w-4 mt-0.5 shrink-0 text-foreground" />
          <p className="text-sm font-medium">
            Become the preferred marketplace for US jewelers
          </p>
        </div>
        <div className="border-l-2 border-muted pl-4 space-y-2">
          <div className="flex items-start gap-2">
            <Target className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Grow monthly active buyers from{" "}
              <span className="text-foreground font-medium">200</span> to{" "}
              <span className="text-foreground font-medium">500</span>
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Target className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Reduce checkout drop-off from{" "}
              <span className="text-foreground font-medium">38%</span> to{" "}
              <span className="text-foreground font-medium">20%</span>
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Target className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Reach NPS of <span className="text-foreground font-medium">50</span> from{" "}
              <span className="text-foreground font-medium">32</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <Tip>Objectives are qualitative and inspirational — not tasks.</Tip>
        <Tip>Key Results start with a verb and end with a number. Each has one owner.</Tip>
        <Tip>
          Projects you run to move KRs live under{" "}
          <strong className="text-foreground">Initiatives</strong>.
        </Tip>
      </div>

      <div className="mt-8 flex justify-center">
        {canManage ? (
          <CreateObjectiveDialog />
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            Ask an admin or manager to create the first objective.
          </p>
        )}
      </div>
    </div>
  );
}

export default function OKRs() {
  const { objectives, isLoading: objectivesLoading } = useObjectives();
  const { keyResults, isLoading: keyResultsLoading } = useAllKeyResults();
  const { roles } = useAuth();

  const canManage = roles.includes("admin") || roles.includes("manager");
  const isLoading = objectivesLoading || keyResultsLoading;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold font-display">Objectives & Key Results</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base hidden sm:block">
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
        <EmptyState canManage={canManage} />
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
