import { useMemo } from "react";
import { Initiative, InitiativeStatus, useInitiatives } from "@/hooks/useInitiatives";
import { BoardColumn } from "./BoardColumn";
import { useAuth } from "@/contexts/AuthContext";

const COLUMNS: { status: InitiativeStatus; label: string }[] = [
  { status: "not_started", label: "Not Started" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
  { status: "blocked", label: "Blocked" },
];

interface BoardViewProps {
  initiatives: Initiative[];
}

export function BoardView({ initiatives }: BoardViewProps) {
  const { updateInitiative } = useInitiatives();
  const { roles, profile } = useAuth();

  const canManage = roles.includes("admin") || roles.includes("manager");

  const grouped = useMemo(() => {
    const map: Record<InitiativeStatus, Initiative[]> = {
      not_started: [],
      in_progress: [],
      completed: [],
      blocked: [],
    };
    initiatives.forEach((i) => map[i.status].push(i));
    return map;
  }, [initiatives]);

  const handleDrop = (initiativeId: string, newStatus: InitiativeStatus) => {
    const initiative = initiatives.find((i) => i.id === initiativeId);
    if (!initiative || initiative.status === newStatus) return;

    const isOwner = initiative.owner_id === profile?.id;
    if (!canManage && !isOwner) return;

    updateInitiative.mutate({ id: initiativeId, status: newStatus });
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-x-visible sm:pb-0">
      {COLUMNS.map((col) => (
        <BoardColumn
          key={col.status}
          status={col.status}
          label={col.label}
          initiatives={grouped[col.status]}
          canDrag={canManage}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}
