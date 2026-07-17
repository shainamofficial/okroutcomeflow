import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { OrganizationProfileSection } from '@/components/organization/OrganizationProfileSection';
import { OrganizationDomainsSection } from '@/components/organization/OrganizationDomainsSection';
import { DeveloperNotesSection } from '@/components/organization/DeveloperNotesSection';
import type { Organization, OrganizationDomain } from '@/components/organization/types';

export default function OrganizationSettings() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [domains, setDomains] = useState<OrganizationDomain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.organization_id]);

  const fetchData = async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      const [orgData, domainsData] = await Promise.all([
        trpc.organizations.current.query(),
        trpc.organizations.domains.query(),
      ]);

      if (orgData) setOrganization(orgData);
      setDomains(domainsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load organization data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Organization Settings</h1>
        <p className="text-muted-foreground">Manage your organization profile and domains.</p>
      </div>

      {organization && (
        <OrganizationProfileSection
          organization={organization}
          onOrganizationChange={setOrganization}
        />
      )}

      {organization && (
        <OrganizationDomainsSection
          organizationId={organization.id}
          domains={domains}
          onDomainsChange={setDomains}
        />
      )}

      <DeveloperNotesSection />
    </div>
  );
}
