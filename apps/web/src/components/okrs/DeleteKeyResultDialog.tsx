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
import { useKeyResults, KeyResult } from "@/hooks/useOKRs";

interface DeleteKeyResultDialogProps {
  keyResult: KeyResult;
  hasChildren: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteKeyResultDialog({
  keyResult,
  hasChildren,
  open,
  onOpenChange,
}: DeleteKeyResultDialogProps) {
  const { deleteKeyResult } = useKeyResults();

  const handleDelete = async () => {
    await deleteKeyResult.mutateAsync(keyResult.id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Key Result</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{keyResult.title}"?
            {hasChildren && (
              <span className="block mt-2 font-medium text-destructive">
                This Key Result has nested sub-Key Results. Deleting it will also delete all child Key Results.
              </span>
            )}
            <span className="block mt-2">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteKeyResult.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
