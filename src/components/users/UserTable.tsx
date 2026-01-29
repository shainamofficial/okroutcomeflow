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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type UserStatus = Database['public']['Enums']['user_status'];
type AppRole = Database['public']['Enums']['app_role'];

interface User {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  created_at: string;
  roles: AppRole[];
}

interface UserTableProps {
  users: User[];
  isAdmin: boolean;
  isManager: boolean;
  adminCount: number;
  currentUserId?: string;
  onApprove?: (userId: string) => void;
  onReject?: (userId: string) => void;
  onDeactivate?: (userId: string) => void;
  onReactivate?: (userId: string) => void;
  onRoleChange?: (userId: string, newRole: AppRole) => void;
  tableType: 'active' | 'pending' | 'inactive';
}

const roleLabels: Record<AppRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  contributor: 'Contributor',
  viewer: 'Viewer',
};

export function UserTable({
  users,
  isAdmin,
  isManager,
  adminCount,
  currentUserId,
  onApprove,
  onReject,
  onDeactivate,
  onReactivate,
  onRoleChange,
  tableType,
}: UserTableProps) {
  const getRoleBadgeVariant = (role: AppRole): "default" | "secondary" | "outline" | "success" | "warning" | "info" => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'manager':
        return 'info';
      case 'contributor':
        return 'success';
      default:
        return 'outline';
    }
  };

  const canChangeRole = (user: User) => {
    if (!isAdmin) return false;
    if (user.id === currentUserId) return false;
    
    // Cannot demote last admin
    if (user.roles.includes('admin') && adminCount <= 1) {
      return false;
    }
    
    return true;
  };

  const getAvailableRoles = (): AppRole[] => {
    if (isAdmin) {
      return ['admin', 'manager', 'contributor', 'viewer'];
    }
    if (isManager) {
      return ['manager', 'contributor', 'viewer'];
    }
    return [];
  };

  const canDeactivate = (user: User) => {
    if (!isAdmin) return false;
    if (user.id === currentUserId) return false;
    
    // Cannot deactivate last admin
    if (user.roles.includes('admin') && adminCount <= 1) {
      return false;
    }
    
    return true;
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No users found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name || 'Unnamed'}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              {tableType === 'active' && canChangeRole(user) && onRoleChange ? (
                <Select
                  value={user.roles[0]}
                  onValueChange={(value) => onRoleChange(user.id, value as AppRole)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRoles().map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-1">
                  {user.roles.map((role) => (
                    <Badge key={role} variant={getRoleBadgeVariant(role)}>
                      {roleLabels[role]}
                    </Badge>
                  ))}
                </div>
              )}
            </TableCell>
            <TableCell>
              {format(new Date(user.created_at), 'MMM d, yyyy')}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                {tableType === 'pending' && (
                  <>
                    {onApprove && (
                      <Button
                        size="sm"
                        onClick={() => onApprove(user.id)}
                      >
                        Approve
                      </Button>
                    )}
                    {onReject && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onReject(user.id)}
                      >
                        Reject
                      </Button>
                    )}
                  </>
                )}
                {tableType === 'active' && canDeactivate(user) && onDeactivate && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeactivate(user.id)}
                  >
                    Deactivate
                  </Button>
                )}
                {tableType === 'inactive' && isAdmin && onReactivate && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReactivate(user.id)}
                  >
                    Reactivate
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
