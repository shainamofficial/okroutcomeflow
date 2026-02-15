import { useState } from "react";
import { Initiative, InitiativeStatus } from "@/hooks/useInitiatives";
import { BoardInitiativeCard } from "./BoardInitiativeCard";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BoardColumnProps {
  status: InitiativeStatus;
  label: string;
  initiatives: Initiative[];
  canDrag: boolean;
  onDrop: (initiativeId: string, status: InitiativeStatus) => void;
}

export function BoardColumn({ status, label, initiatives, canDrag, onDrop }: BoardColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const id = e.dataTransfer.getData("initiative-id");
    if (id) onDrop(id, status);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg bg-muted/40 border min-w-[260px] w-full transition-colors",
        isDragOver && "ring-2 ring-primary/40 bg-muted/60"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
    >
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="text-xs text-muted-foreground">{initiatives.length}</span>
      </div>
      <ScrollArea className="flex-1 max-h-[calc(100vh-280px)]">
        <div className="p-2 space-y-2">
          {initiatives.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No initiatives</p>
          ) : (
            initiatives.map((init) => (
              <BoardInitiativeCard key={init.id} initiative={init} canDrag={canDrag} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
