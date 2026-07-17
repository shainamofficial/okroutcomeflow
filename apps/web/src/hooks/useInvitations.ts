import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
type InvitationStatus = Database['public']['Enums']['invitation_status'];

// Safe invitation type from the secure view (excludes token)
interface Invitation {
  id: string;
  email: string;
  role: AppRole;
  status: InvitationStatus;
  created_at: string;
  expires_at: string | null;
}

export function useInvitations() {
  const { profile, roles } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = roles.includes('admin');
  const isManager = roles.includes('manager');

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['invitations', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      return (await trpc.invitations.list.query()) as Invitation[];
    },
    enabled: !!profile?.organization_id && (isAdmin || isManager),
  });

  const createInvitation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AppRole }) => {
      if (!profile?.organization_id) throw new Error('No organization');
      return await trpc.invitations.create.mutate({ email, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast({ title: 'Invitation created' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const revokeInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      await trpc.invitations.revoke.mutate({ invitationId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast({ title: 'Invitation revoked' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const pendingInvitations = invitations.filter((i) => i.status === 'pending');

  return {
    invitations,
    pendingInvitations,
    isLoading,
    createInvitation,
    revokeInvitation,
  };
}
