import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Lightbulb } from "lucide-react";
import { useKRInitiativeLinks, Initiative } from "@/hooks/useInitiatives";
import { InitiativeStatusBadge } from "@/components/initiatives/InitiativeStatusBadge";
import { InitiativeDetailDrawer } from "@/components/initiatives/InitiativeDetailDrawer";

interface KRLinkedInitiativesProps {
  keyResultId: string;
}

export function KRLinkedInitiatives({ keyResultId }: KRLinkedInitiativesProps) {
  const { initiatives, isLoading } = useKRInitiativeLinks(keyResultId);
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);

  if (isLoading || initiatives.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Lightbulb className="h-3 w-3" />
          <span>Linked Initiatives</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {initiatives.map((link) => {
            const initiative = link.initiative as unknown as Initiative;
            if (!initiative) return null;
            
            return (
              <Badge
                key={link.id}
                variant="outline"
                className="text-xs cursor-pointer hover:bg-accent transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedInitiative(initiative);
                }}
              >
                <span className="mr-1">{initiative.title}</span>
                <InitiativeStatusBadge status={initiative.status} />
              </Badge>
            );
          })}
        </div>
      </div>

      {selectedInitiative && (
        <InitiativeDetailDrawer
          initiative={selectedInitiative}
          open={!!selectedInitiative}
          onOpenChange={(open) => !open && setSelectedInitiative(null)}
        />
      )}
    </>
  );
}
