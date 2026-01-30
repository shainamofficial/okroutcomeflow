import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

// Full invitation type returned after creation (includes token for sharing)
interface NewInvitation extends Invitation {
  token: string | null;
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
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

      // Query the safe view that excludes sensitive token data
      const { data, error } = await supabase
        .from('user_invitations_safe')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invitation[];
    },
    enabled: !!profile?.organization_id && (isAdmin || isManager),
  });

  const createInvitation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AppRole }) => {
      if (!profile?.organization_id) throw new Error('No organization');

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users_profile')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Check if pending invitation exists
      const { data: existingInvite } = await supabase
        .from('user_invitations')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .eq('status', 'pending')
        .maybeSingle();

      if (existingInvite) {
        throw new Error('A pending invitation already exists for this email');
      }

      const token = generateToken();

      const { data, error } = await supabase
        .from('user_invitations')
        .insert({
          organization_id: profile.organization_id,
          email: email.toLowerCase().trim(),
          role,
          token,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { error } = await supabase
        .from('user_invitations')
        .update({ status: 'revoked' })
        .eq('id', invitationId);

      if (error) throw error;
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
