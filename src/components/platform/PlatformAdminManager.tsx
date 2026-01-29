import { useState } from 'react';
import { format } from 'date-fns';
import { Shield, Trash2, Plus, Loader2 } from 'lucide-react';
import { usePlatformAdmins } from '@/hooks/usePlatformAdmins';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function PlatformAdminManager() {
  const { admins, isLoading, addAdmin, removeAdmin } = usePlatformAdmins();
  const [newEmail, setNewEmail] = useState('');
  const [deleteAdminId, setDeleteAdminId] = useState<string | null>(null);

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail.trim()) {
      addAdmin.mutate(newEmail.trim(), {
        onSuccess: () => setNewEmail(''),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const adminToDelete = admins.find((a) => a.id === deleteAdminId);
  const isLastAdmin = admins.length === 1;

  return (
    <div className="space-y-6">
      {/* Add new admin form */}
      <form onSubmit={handleAddAdmin} className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter email address..."
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" disabled={!newEmail.trim() || addAdmin.isPending}>
          {addAdmin.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Add Admin
        </Button>
      </form>

      {/* Admins table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No platform admins found
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-medium">{admin.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(admin.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteAdminId(admin.id)}
                      disabled={isLastAdmin}
                      title={isLastAdmin ? 'Cannot remove the last platform admin' : 'Remove admin'}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {isLastAdmin && (
        <p className="text-sm text-muted-foreground">
          <Shield className="h-4 w-4 inline-block mr-1" />
          You cannot remove the last platform admin. Add another admin first.
        </p>
      )}

      <AlertDialog open={!!deleteAdminId} onOpenChange={() => setDeleteAdminId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Platform Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{adminToDelete?.email}</strong> as a platform
              admin? They will no longer have access to the platform management area.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteAdminId) {
                  removeAdmin.mutate(deleteAdminId);
                  setDeleteAdminId(null);
                }
              }}
            >
              Remove Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
