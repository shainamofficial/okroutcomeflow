import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';

interface PlatformAdmin {
  id: string;
  email: string;
  created_at: string;
}

export function usePlatformAdmins() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: admins = [], isLoading, error } = useQuery({
    queryKey: ['platform-admins'],
    queryFn: async () => (await trpc.platform.admins.list.query()) as PlatformAdmin[],
  });

  const addAdmin = useMutation({
    mutationFn: async (email: string) => {
      await trpc.platform.admins.add.mutate({ email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-admins'] });
      toast({
        title: 'Platform admin added',
        description: 'The user has been granted platform admin access.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error adding platform admin',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removeAdmin = useMutation({
    mutationFn: async (id: string) => {
      await trpc.platform.admins.remove.mutate({ id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-admins'] });
      toast({
        title: 'Platform admin removed',
        description: 'Platform admin access has been revoked.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error removing platform admin',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    admins,
    isLoading,
    error,
    addAdmin,
    removeAdmin,
  };
}
