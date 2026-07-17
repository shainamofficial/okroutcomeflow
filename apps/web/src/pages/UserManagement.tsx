import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserTable } from '@/components/users/UserTable';
import { InvitationsTable } from '@/components/users/InvitationsTable';
import { InviteUserDialog } from '@/components/users/InviteUserDialog';
import { useOrgUsers } from '@/hooks/useOrgUsers';
import { useInvitations } from '@/hooks/useInvitations';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/types/db';

type AppRole = Database['public']['Enums']['app_role'];

export default function UserManagement() {
  const { user } = useAuth();
  const {
    activeUsers,
    pendingUsers,
    inactiveUsers,
    adminCount,
    isLoading: usersLoading,
    isAdmin,
    isManager,
    updateUserStatus,
    updateUserRole,
  } = useOrgUsers();

  const {
    invitations,
    isLoading: invitationsLoading,
    revokeInvitation,
  } = useInvitations();

  const handleApprove = (userId: string) => {
    updateUserStatus.mutate({ userId, status: 'active' });
  };

  const handleReject = (userId: string) => {
    updateUserStatus.mutate({ userId, status: 'inactive' });
  };

  const handleDeactivate = (userId: string) => {
    updateUserStatus.mutate({ userId, status: 'inactive' });
  };

  const handleReactivate = (userId: string) => {
    updateUserStatus.mutate({ userId, status: 'active' });
  };

  const handleRoleChange = (userId: string, newRole: AppRole) => {
    const targetUser = activeUsers.find((u) => u.id === userId);
    
    if (targetUser?.roles.includes('admin') && newRole !== 'admin' && adminCount <= 1) {
      toast({
        title: 'Cannot change role',
        description: 'Cannot demote the last admin in the organization.',
        variant: 'destructive',
      });
      return;
    }
    
    updateUserRole.mutate({ userId, newRole });
  };

  if (usersLoading || invitationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage team members and invitations
          </p>
        </div>
        <InviteUserDialog />
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeUsers.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive ({inactiveUsers.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations ({invitations.filter((i) => i.status === 'pending').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
              <CardDescription>
                Users with full access to the organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable
                users={activeUsers}
                isAdmin={isAdmin}
                isManager={isManager}
                adminCount={adminCount}
                currentUserId={user?.id}
                onDeactivate={handleDeactivate}
                onRoleChange={handleRoleChange}
                tableType="active"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Users</CardTitle>
              <CardDescription>
                Users awaiting approval to join the organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable
                users={pendingUsers}
                isAdmin={isAdmin}
                isManager={isManager}
                adminCount={adminCount}
                currentUserId={user?.id}
                onApprove={handleApprove}
                onReject={handleReject}
                tableType="pending"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive">
          <Card>
            <CardHeader>
              <CardTitle>Inactive Users</CardTitle>
              <CardDescription>
                Users who have been deactivated or rejected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable
                users={inactiveUsers}
                isAdmin={isAdmin}
                isManager={isManager}
                adminCount={adminCount}
                currentUserId={user?.id}
                onReactivate={handleReactivate}
                tableType="inactive"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle>Invitations</CardTitle>
              <CardDescription>
                Pending and past invitations to join the organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvitationsTable
                invitations={invitations}
                onRevoke={(id) => revokeInvitation.mutate(id)}
                isRevoking={revokeInvitation.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
