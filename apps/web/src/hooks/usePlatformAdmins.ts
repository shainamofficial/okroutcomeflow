import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
    queryFn: async () => {
      if (trpc) {
        return (await trpc.platform.admins.list.query()) as PlatformAdmin[];
      }
      const { data, error } = await supabase
        .from('platform_admins')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as PlatformAdmin[];
    },
  });

  const addAdmin = useMutation({
    mutationFn: async (email: string) => {
      if (trpc) {
        await trpc.platform.admins.add.mutate({ email });
        return;
      }
      const normalizedEmail = email.trim().toLowerCase();

      const { error } = await supabase
        .from('platform_admins')
        .insert({ email: normalizedEmail });

      if (error) throw error;
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
      if (trpc) {
        await trpc.platform.admins.remove.mutate({ id });
        return;
      }
      // Check if this is the last admin
      const { data: countData } = await supabase.rpc('count_platform_admins');

      if (countData && countData <= 1) {
        throw new Error('Cannot remove the last platform admin');
      }

      const { error } = await supabase
        .from('platform_admins')
        .delete()
        .eq('id', id);

      if (error) throw error;
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
