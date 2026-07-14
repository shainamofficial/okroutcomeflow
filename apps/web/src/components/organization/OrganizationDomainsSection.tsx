import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Globe, Trash2, CheckCircle, XCircle, Info, Loader2 } from 'lucide-react';
import type { OrganizationDomain } from './types';

interface OrganizationDomainsSectionProps {
  organizationId: string;
  domains: OrganizationDomain[];
  onDomainsChange: (domains: OrganizationDomain[]) => void;
}

const normalizeDomain = (input: string): string => {
  let domain = input.trim().toLowerCase();
  if (domain.startsWith('@')) {
    domain = domain.slice(1);
  }
  return domain;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export function OrganizationDomainsSection({
  organizationId,
  domains,
  onDomainsChange,
}: OrganizationDomainsSectionProps) {
  const { toast } = useToast();
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;

    const normalizedDomain = normalizeDomain(newDomain);
    if (!normalizedDomain) {
      toast({
        title: 'Error',
        description: 'Please enter a valid domain.',
        variant: 'destructive',
      });
      return;
    }

    setAddingDomain(true);
    try {
      const existsInOrg = domains.some((d) => d.domain === normalizedDomain);
      if (existsInOrg) {
        toast({
          title: 'Error',
          description: 'This domain is already added to your organization.',
          variant: 'destructive',
        });
        setAddingDomain(false);
        return;
      }

      const { data: isGeneric, error: genericError } = await supabase.rpc(
        'is_generic_domain',
        { _domain: normalizedDomain }
      );

      if (genericError) throw genericError;

      if (isGeneric) {
        toast({
          title: 'Error',
          description: 'Generic email domains like gmail.com, outlook.com, etc. cannot be added. Please use a corporate domain.',
          variant: 'destructive',
        });
        setAddingDomain(false);
        return;
      }

      const { data: existsGlobally, error: checkError } = await supabase.rpc(
        'domain_exists_for_other_org',
        { _domain: normalizedDomain, _org_id: organizationId }
      );

      if (checkError) throw checkError;

      if (existsGlobally) {
        toast({
          title: 'Error',
          description: 'Domain already claimed by another organization.',
          variant: 'destructive',
        });
        setAddingDomain(false);
        return;
      }

      const { data: newDomainData, error: insertError } = await supabase
        .from('organization_domains')
        .insert({
          organization_id: organizationId,
          domain: normalizedDomain,
          verified: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      onDomainsChange([...domains, newDomainData]);
      setNewDomain('');
      toast({
        title: 'Success',
        description: 'Domain added successfully.',
      });
    } catch (error) {
      console.error('Error adding domain:', error);
      toast({
        title: 'Error',
        description: 'Failed to add domain.',
        variant: 'destructive',
      });
    } finally {
      setAddingDomain(false);
    }
  };

  const canDeleteDomain = (domainToDelete: OrganizationDomain): { allowed: boolean; reason?: string } => {
    if (domains.length <= 1 && domainToDelete.verified) {
      const verifiedCount = domains.filter((d) => d.verified).length;
      if (verifiedCount <= 1) {
        return { allowed: false, reason: 'Cannot delete the only verified domain. At least one verified domain must remain for automatic signups.' };
      }
    }

    if (domainToDelete.verified) {
      const verifiedCount = domains.filter((d) => d.verified).length;
      if (verifiedCount <= 1) {
        return { allowed: false, reason: 'Cannot delete the only verified domain. At least one verified domain must remain.' };
      }
    }

    return { allowed: true };
  };

  const handleDeleteDomain = async (domain: OrganizationDomain) => {
    const { allowed, reason } = canDeleteDomain(domain);
    if (!allowed) {
      toast({
        title: 'Error',
        description: reason,
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('organization_domains')
        .delete()
        .eq('id', domain.id);

      if (error) throw error;

      onDomainsChange(domains.filter((d) => d.id !== domain.id));
      toast({
        title: 'Success',
        description: 'Domain deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting domain:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete domain.',
        variant: 'destructive',
      });
    }
  };

  const canToggleVerified = (domain: OrganizationDomain, newValue: boolean): { allowed: boolean; reason?: string } => {
    if (domain.verified && !newValue) {
      const verifiedCount = domains.filter((d) => d.verified).length;
      if (verifiedCount <= 1) {
        return { allowed: false, reason: 'Cannot unverify the only verified domain. At least one verified domain must remain.' };
      }
    }
    return { allowed: true };
  };

  const handleToggleVerified = async (domain: OrganizationDomain) => {
    const newValue = !domain.verified;
    const { allowed, reason } = canToggleVerified(domain, newValue);

    if (!allowed) {
      toast({
        title: 'Error',
        description: reason,
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('organization_domains')
        .update({ verified: newValue })
        .eq('id', domain.id);

      if (error) throw error;

      onDomainsChange(domains.map((d) => (d.id === domain.id ? { ...d, verified: newValue } : d)));
      toast({
        title: 'Success',
        description: `Domain ${newValue ? 'verified' : 'unverified'} successfully.`,
      });
    } catch (error) {
      console.error('Error updating domain:', error);
      toast({
        title: 'Error',
        description: 'Failed to update domain verification.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Organization Domains
        </CardTitle>
        <CardDescription>
          Manage domains associated with your organization. Users signing up with these email
          domains will be added to your organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Domain */}
        <div className="flex gap-2">
          <Input
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="example.com"
            onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
          />
          <Button onClick={handleAddDomain} disabled={addingDomain || !newDomain.trim()}>
            {addingDomain ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Domain'}
          </Button>
        </div>

        {/* Domain List */}
        {domains.length > 0 ? (
          <div className="border rounded-md divide-y">
            {domains.map((domain) => {
              const deleteCheck = canDeleteDomain(domain);
              return (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-3 gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate">{domain.domain}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {formatDate(domain.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={domain.verified}
                        onCheckedChange={() => handleToggleVerified(domain)}
                      />
                      {domain.verified ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          disabled={!deleteCheck.allowed}
                          title={deleteCheck.reason}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Domain</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete <strong>{domain.domain}</strong>? Users
                            with this email domain will no longer be able to join your organization
                            automatically.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteDomain(domain)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed rounded-md p-4 bg-muted/30">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">This organization is invite-only</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No domains are configured. Members can only join via invitation. Add a corporate domain to allow automatic signups for users with matching email addresses.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
