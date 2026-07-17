import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
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
    queryFn: async () =>
      (await trpc.platform.orgs.list.query()) as unknown as OrganizationWithCounts[],
  });

  const getOrganizationDetail = async (orgId: string): Promise<OrganizationDetail | null> =>
    (await trpc.platform.orgs.detail.query({ orgId })) as OrganizationDetail | null;

  const deleteOrganization = useMutation({
    mutationFn: async (orgId: string) => {
      await trpc.platform.orgs.delete.mutate({ orgId });
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
