import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  created_at: string;
  organization_id: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function useTeams() {
  const { profile, roles } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = roles.includes('admin');
  const isManager = roles.includes('manager');
  const canManage = isAdmin || isManager;

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('name');

      if (error) throw error;
      return data as Team[];
    },
    enabled: !!profile?.organization_id,
  });

  const createTeam = useMutation({
    mutationFn: async (name: string) => {
      if (!profile?.organization_id) throw new Error('No organization');

      const { error } = await supabase
        .from('teams')
        .insert({
          organization_id: profile.organization_id,
          name: name.trim(),
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('A team with this name already exists');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({ title: 'Team created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const renameTeam = useMutation({
    mutationFn: async ({ teamId, name }: { teamId: string; name: string }) => {
      const { error } = await supabase
        .from('teams')
        .update({ name: name.trim() })
        .eq('id', teamId);

      if (error) {
        if (error.code === '23505') {
          throw new Error('A team with this name already exists');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({ title: 'Team renamed successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTeam = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({ title: 'Team deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    teams,
    teamsLoading,
    canManage,
    createTeam,
    renameTeam,
    deleteTeam,
  };
}

export function useTeamMembers(teamId: string | null) {
  const queryClient = useQueryClient();

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      if (!teamId) return [];

      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          user_id,
          created_at,
          user:users_profile!team_members_user_id_fkey(id, name, email)
        `)
        .eq('team_id', teamId);

      if (error) throw error;
      
      return (data || []).map(m => ({
        ...m,
        user: Array.isArray(m.user) ? m.user[0] : m.user,
      })) as TeamMember[];
    },
    enabled: !!teamId,
  });

  const addMember = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const { error } = await supabase
        .from('team_members')
        .insert({ team_id: teamId, user_id: userId });

      if (error) {
        if (error.code === '23505') {
          throw new Error('User is already a member of this team');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({ title: 'Member added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({ title: 'Member removed successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    members,
    membersLoading,
    addMember,
    removeMember,
  };
}
