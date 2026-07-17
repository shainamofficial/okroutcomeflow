import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type UserStatus = Database['public']['Enums']['user_status'];
type AppRole = Database['public']['Enums']['app_role'];

interface OrgUser {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  created_at: string;
  roles: AppRole[];
}

export function useOrgUsers() {
  const { profile, roles } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = roles.includes('admin');
  const isManager = roles.includes('manager');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['org-users', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      return (await trpc.orgUsers.list.query()) as OrgUser[];
    },
    enabled: !!profile?.organization_id && (isAdmin || isManager),
  });

  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: UserStatus }) => {
      await trpc.orgUsers.updateStatus.mutate({ userId, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-users'] });
      toast({ title: 'User status updated' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      await trpc.orgUsers.updateRole.mutate({ userId, newRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-users'] });
      toast({ title: 'User role updated' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const activeUsers = users.filter((u) => u.status === 'active');
  const pendingUsers = users.filter((u) => u.status === 'pending');
  const inactiveUsers = users.filter((u) => u.status === 'inactive');

  const adminCount = activeUsers.filter((u) => u.roles.includes('admin')).length;

  return {
    users,
    activeUsers,
    pendingUsers,
    inactiveUsers,
    adminCount,
    isLoading,
    isAdmin,
    isManager,
    updateUserStatus,
    updateUserRole,
  };
}
