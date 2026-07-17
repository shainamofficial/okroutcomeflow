import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
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
      return (await trpc.teams.list.query()) as Team[];
    },
    enabled: !!profile?.organization_id,
  });

  const createTeam = useMutation({
    mutationFn: async (name: string) => {
      if (!profile?.organization_id) throw new Error('No organization');
      await trpc.teams.create.mutate({ name });
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
      await trpc.teams.rename.mutate({ teamId, name });
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
      await trpc.teams.remove.mutate({ teamId });
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
      return (await trpc.teams.members.query({ teamId })) as TeamMember[];
    },
    enabled: !!teamId,
  });

  const addMember = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      await trpc.teams.addMember.mutate({ teamId, userId });
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
      await trpc.teams.removeMember.mutate({ memberId });
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
