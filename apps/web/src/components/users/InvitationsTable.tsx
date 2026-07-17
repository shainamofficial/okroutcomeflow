import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, isPast } from 'date-fns';
import { X } from 'lucide-react';
import type { Database } from '@/types/db';

type AppRole = Database['public']['Enums']['app_role'];
type InvitationStatus = Database['public']['Enums']['invitation_status'];

// Safe invitation type - token is no longer exposed for security
interface Invitation {
  id: string;
  email: string;
  role: AppRole;
  status: InvitationStatus;
  created_at: string;
  expires_at: string | null;
}

interface InvitationsTableProps {
  invitations: Invitation[];
  onRevoke: (id: string) => void;
  isRevoking: boolean;
}

const roleLabels: Record<AppRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  contributor: 'Contributor',
  viewer: 'Viewer',
};

const statusVariants: Record<InvitationStatus, 'default' | 'secondary' | 'destructive'> = {
  pending: 'secondary',
  accepted: 'default',
  revoked: 'destructive',
};

export function InvitationsTable({ invitations, onRevoke, isRevoking }: InvitationsTableProps) {

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return isPast(new Date(expiresAt));
  };

  const getStatusDisplay = (invitation: Invitation) => {
    if (invitation.status === 'pending' && isExpired(invitation.expires_at)) {
      return { label: 'Expired', variant: 'destructive' as const };
    }
    return {
      label: invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1),
      variant: statusVariants[invitation.status],
    };
  };

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No invitations sent yet
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => {
          const statusDisplay = getStatusDisplay(invitation);
          const expired = isExpired(invitation.expires_at);

          return (
            <TableRow key={invitation.id}>
              <TableCell className="font-medium">{invitation.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{roleLabels[invitation.role]}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={statusDisplay.variant}>
                  {statusDisplay.label}
                </Badge>
              </TableCell>
              <TableCell>
                {invitation.expires_at ? (
                  <span className={expired ? 'text-destructive' : 'text-muted-foreground'}>
                    {format(new Date(invitation.expires_at), 'MMM d, yyyy')}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {invitation.status === 'pending' && !expired && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRevoke(invitation.id)}
                      disabled={isRevoking}
                      title="Revoke invitation"
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
