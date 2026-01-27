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
import { Initiative, useInitiatives } from "@/hooks/useInitiatives";

interface DeleteInitiativeDialogProps {
  initiative: Initiative;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteInitiativeDialog({
  initiative,
  open,
  onOpenChange,
}: DeleteInitiativeDialogProps) {
  const { deleteInitiative } = useInitiatives();

  const handleDelete = async () => {
    await deleteInitiative.mutateAsync(initiative.id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Initiative</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{initiative.title}"? This action
            cannot be undone and will remove all linked Key Result associations.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
