import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

      if (trpc) {
        return (await trpc.orgUsers.list.query()) as OrgUser[];
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('users_profile')
        .select('id, name, email, status, created_at')
        .eq('organization_id', profile.organization_id);

      if (profilesError) throw profilesError;

      const { data: allRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles: OrgUser[] = (profiles || []).map((p) => ({
        ...p,
        roles: (allRoles || [])
          .filter((r) => r.user_id === p.id)
          .map((r) => r.role),
      }));

      return usersWithRoles;
    },
    enabled: !!profile?.organization_id && (isAdmin || isManager),
  });

  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: UserStatus }) => {
      const { error } = await supabase
        .from('users_profile')
        .update({ status })
        .eq('id', userId);

      if (error) throw error;
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
      // First delete existing role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Then insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;
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
