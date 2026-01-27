import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useObjectives, Objective } from "@/hooks/useOKRs";

interface DeleteObjectiveDialogProps {
  objective: Objective;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteObjectiveDialog({
  objective,
  open,
  onOpenChange,
}: DeleteObjectiveDialogProps) {
  const { deleteObjective } = useObjectives();

  const handleDelete = async () => {
    await deleteObjective.mutateAsync(objective.id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Objective</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{objective.title}"? This will also delete all associated Key Results. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteObjective.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
