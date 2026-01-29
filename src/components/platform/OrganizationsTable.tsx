import { useState } from 'react';
import { format } from 'date-fns';
import { Building2, Users, UsersRound, Target, Eye, Trash2 } from 'lucide-react';
import { usePlatformOrganizations } from '@/hooks/usePlatformOrganizations';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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
import { OrganizationDetailDrawer } from './OrganizationDetailDrawer';

export function OrganizationsTable() {
  const { organizations, isLoading, deleteOrganization } = usePlatformOrganizations();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [deleteOrgId, setDeleteOrgId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const orgToDelete = organizations.find((o) => o.id === deleteOrgId);

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-center">
                <Users className="h-4 w-4 inline-block" />
              </TableHead>
              <TableHead className="text-center">
                <UsersRound className="h-4 w-4 inline-block" />
              </TableHead>
              <TableHead className="text-center">
                <Target className="h-4 w-4 inline-block" />
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No organizations found
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {org.logo_url ? (
                        <img
                          src={org.logo_url}
                          alt={org.name}
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      )}
                      <span className="font-medium">{org.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(org.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-center">{org.user_count}</TableCell>
                  <TableCell className="text-center">{org.team_count}</TableCell>
                  <TableCell className="text-center">{org.objective_count}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedOrgId(org.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteOrgId(org.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <OrganizationDetailDrawer
        organizationId={selectedOrgId}
        onClose={() => setSelectedOrgId(null)}
      />

      <AlertDialog open={!!deleteOrgId} onOpenChange={() => setDeleteOrgId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{orgToDelete?.name}</strong>? This will
              permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{orgToDelete?.user_count} users</li>
                <li>{orgToDelete?.team_count} teams</li>
                <li>{orgToDelete?.objective_count} objectives</li>
                <li>All related key results, initiatives, tasks, and updates</li>
              </ul>
              <p className="mt-2 font-medium text-destructive">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteOrgId) {
                  deleteOrganization.mutate(deleteOrgId);
                  setDeleteOrgId(null);
                }
              }}
            >
              Delete Organization
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
