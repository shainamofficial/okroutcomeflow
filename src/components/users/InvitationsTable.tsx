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
import { format } from 'date-fns';
import { Copy, Check, X } from 'lucide-react';
import { useState } from 'react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
type InvitationStatus = Database['public']['Enums']['invitation_status'];

interface Invitation {
  id: string;
  email: string;
  role: AppRole;
  status: InvitationStatus;
  token: string | null;
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = async (token: string, id: string) => {
    const link = `${window.location.origin}/signup-invite?token=${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => (
          <TableRow key={invitation.id}>
            <TableCell className="font-medium">{invitation.email}</TableCell>
            <TableCell>
              <Badge variant="outline">{roleLabels[invitation.role]}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={statusVariants[invitation.status]}>
                {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell>
              {format(new Date(invitation.created_at), 'MMM d, yyyy')}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                {invitation.status === 'pending' && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleCopyLink(invitation.token, invitation.id)}
                      title="Copy invitation link"
                    >
                      {copiedId === invitation.id ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRevoke(invitation.id)}
                      disabled={isRevoking}
                      title="Revoke invitation"
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
