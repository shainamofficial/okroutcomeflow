import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    queryFn: async () =>
      (await trpc.platform.users.list.query()) as unknown as PlatformUser[],
  });

  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: UserStatus }) => {
      await trpc.platform.users.updateStatus.mutate({ userId, status });
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
      await trpc.platform.users.updateRole.mutate({ userId, role });
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
      await trpc.platform.users.delete.mutate({ userId });
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
