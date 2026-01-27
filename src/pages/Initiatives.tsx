import { useInitiatives } from "@/hooks/useInitiatives";
import { useAuth } from "@/contexts/AuthContext";
import { CreateInitiativeDialog } from "@/components/initiatives/CreateInitiativeDialog";
import { InitiativeCard } from "@/components/initiatives/InitiativeCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb } from "lucide-react";

export default function Initiatives() {
  const { initiatives, isLoading } = useInitiatives();
  const { roles } = useAuth();

  const canManage = roles.includes("admin") || roles.includes("manager");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Initiatives</h1>
          <p className="text-muted-foreground mt-1">
            Manage initiatives and link them to Key Results
          </p>
        </div>
        {canManage && <CreateInitiativeDialog />}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : initiatives.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">No initiatives yet</h2>
          <p className="text-muted-foreground mt-1">
            {canManage
              ? "Create your first initiative to get started."
              : "No initiatives have been created yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {initiatives.map((initiative) => (
            <InitiativeCard key={initiative.id} initiative={initiative} />
          ))}
        </div>
      )}
    </div>
  );
}
