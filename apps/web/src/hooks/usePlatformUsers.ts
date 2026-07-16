import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';

type UserStatus = 'pending' | 'active' | 'inactive';
type AppRole = 'admin' | 'manager' | 'contributor' | 'viewer';

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  created_at: string;
  organization_id: string | null;
  organization_name: string | null;
  roles: AppRole[];
}

export function usePlatformUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['platform-users'],
    queryFn: async () => {
      if (trpc) {
        return (await trpc.platform.users.list.query()) as unknown as PlatformUser[];
      }
      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('users_profile')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch all organizations
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('id, name');

      const orgMap = (orgsData || []).reduce((acc, org) => {
        acc[org.id] = org.name;
        return acc;
      }, {} as Record<string, string>);

      // Fetch all roles
      const userIds = (usersData || []).map((u) => u.id);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const rolesByUser = (rolesData || []).reduce((acc, r) => {
        if (!acc[r.user_id]) acc[r.user_id] = [];
        acc[r.user_id].push(r.role as AppRole);
        return acc;
      }, {} as Record<string, AppRole[]>);

      return (usersData || []).map((u) => ({
        ...u,
        organization_name: u.organization_id ? orgMap[u.organization_id] || null : null,
        roles: rolesByUser[u.id] || [],
      })) as PlatformUser[];
    },
  });

  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: UserStatus }) => {
      if (trpc) {
        await trpc.platform.users.updateStatus.mutate({ userId, status });
        return;
      }
      const { error } = await supabase
        .from('users_profile')
        .update({ status })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      toast({
        title: 'User status updated',
        description: 'The user status has been changed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating user status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      if (trpc) {
        await trpc.platform.users.updateRole.mutate({ userId, role });
        return;
      }
      // Delete existing roles
      await supabase.from('user_roles').delete().eq('user_id', userId);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      toast({
        title: 'User role updated',
        description: 'The user role has been changed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating user role',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      if (trpc) {
        await trpc.platform.users.delete.mutate({ userId });
        return;
      }
      const { error } = await supabase
        .from('users_profile')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      toast({
        title: 'User deleted',
        description: 'The user has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting user',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    users,
    isLoading,
    error,
    updateUserStatus,
    updateUserRole,
    deleteUser,
  };
}
