import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrganizationWithCounts {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
  user_count: number;
  team_count: number;
  objective_count: number;
}

interface OrganizationDetail {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
  domains: Array<{
    id: string;
    domain: string;
    verified: boolean;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
    created_at: string;
    roles: string[];
  }>;
  teams: Array<{
    id: string;
    name: string;
    member_count: number;
  }>;
  objectives: Array<{
    id: string;
    title: string;
    key_results_count: number;
  }>;
}

export function usePlatformOrganizations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organizations = [], isLoading, error } = useQuery({
    queryKey: ['platform-organizations'],
    queryFn: async () => {
      // Fetch all organizations
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      // Fetch counts for each org
      const orgsWithCounts = await Promise.all(
        (orgs || []).map(async (org) => {
          const [usersRes, teamsRes, objectivesRes] = await Promise.all([
            supabase
              .from('users_profile')
              .select('id', { count: 'exact', head: true })
              .eq('organization_id', org.id),
            supabase
              .from('teams')
              .select('id', { count: 'exact', head: true })
              .eq('organization_id', org.id),
            supabase
              .from('objectives')
              .select('id', { count: 'exact', head: true })
              .eq('organization_id', org.id),
          ]);

          return {
            ...org,
            user_count: usersRes.count || 0,
            team_count: teamsRes.count || 0,
            objective_count: objectivesRes.count || 0,
          } as OrganizationWithCounts;
        })
      );

      return orgsWithCounts;
    },
  });

  const getOrganizationDetail = async (orgId: string): Promise<OrganizationDetail | null> => {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      return null;
    }

    const [domainsRes, usersRes, teamsRes, objectivesRes] = await Promise.all([
      supabase
        .from('organization_domains')
        .select('id, domain, verified')
        .eq('organization_id', orgId),
      supabase
        .from('users_profile')
        .select('id, name, email, status, created_at')
        .eq('organization_id', orgId),
      supabase
        .from('teams')
        .select('id, name')
        .eq('organization_id', orgId),
      supabase
        .from('objectives')
        .select('id, title')
        .eq('organization_id', orgId),
    ]);

    // Get roles for each user
    const userIds = (usersRes.data || []).map((u) => u.id);
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);

    const rolesByUser = (rolesData || []).reduce((acc, r) => {
      if (!acc[r.user_id]) acc[r.user_id] = [];
      acc[r.user_id].push(r.role);
      return acc;
    }, {} as Record<string, string[]>);

    // Get team member counts
    const teamIds = (teamsRes.data || []).map((t) => t.id);
    const { data: memberCounts } = await supabase
      .from('team_members')
      .select('team_id')
      .in('team_id', teamIds);

    const memberCountByTeam = (memberCounts || []).reduce((acc, m) => {
      acc[m.team_id] = (acc[m.team_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get KR counts for objectives
    const objectiveIds = (objectivesRes.data || []).map((o) => o.id);
    const { data: krCounts } = await supabase
      .from('key_results')
      .select('objective_id')
      .in('objective_id', objectiveIds);

    const krCountByObjective = (krCounts || []).reduce((acc, k) => {
      if (k.objective_id) {
        acc[k.objective_id] = (acc[k.objective_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      ...org,
      domains: domainsRes.data || [],
      users: (usersRes.data || []).map((u) => ({
        ...u,
        roles: rolesByUser[u.id] || [],
      })),
      teams: (teamsRes.data || []).map((t) => ({
        ...t,
        member_count: memberCountByTeam[t.id] || 0,
      })),
      objectives: (objectivesRes.data || []).map((o) => ({
        ...o,
        key_results_count: krCountByObjective[o.id] || 0,
      })),
    };
  };

  const deleteOrganization = useMutation({
    mutationFn: async (orgId: string) => {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-organizations'] });
      toast({
        title: 'Organization deleted',
        description: 'The organization and all related data have been deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting organization',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    organizations,
    isLoading,
    error,
    getOrganizationDetail,
    deleteOrganization,
  };
}
