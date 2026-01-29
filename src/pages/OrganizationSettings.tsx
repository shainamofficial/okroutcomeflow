import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Building2, Globe, Upload, Trash2, CheckCircle, XCircle, Info, Loader2 } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
}

interface OrganizationDomain {
  id: string;
  domain: string;
  verified: boolean;
  created_at: string;
  organization_id: string;
}

export default function OrganizationSettings() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [domains, setDomains] = useState<OrganizationDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [orgName, setOrgName] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);

  useEffect(() => {
    fetchData();
  }, [profile?.organization_id]);

  const fetchData = async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .maybeSingle();

      if (orgError) throw orgError;
      if (orgData) {
        setOrganization(orgData);
        setOrgName(orgData.name);
      }

      const { data: domainsData, error: domainsError } = await supabase
        .from('organization_domains')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: true });

      if (domainsError) throw domainsError;
      if (domainsData) {
        setDomains(domainsData);
      }
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

  const handleSaveName = async () => {
    if (!organization || !orgName.trim()) {
      toast({
        title: 'Error',
        description: 'Organization name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ name: orgName.trim() })
        .eq('id', organization.id);

      if (error) throw error;

      setOrganization({ ...organization, name: orgName.trim() });
      toast({
        title: 'Success',
        description: 'Organization name updated.',
      });
    } catch (error) {
      console.error('Error saving name:', error);
      toast({
        title: 'Error',
        description: 'Failed to update organization name.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !organization) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${organization.id}-${Date.now()}.${fileExt}`;
      const filePath = `${organization.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('organization-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('organization-logos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: urlData.publicUrl })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      setOrganization({ ...organization, logo_url: urlData.publicUrl });
      toast({
        title: 'Success',
        description: 'Logo uploaded successfully.',
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload logo.',
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const normalizeDomain = (input: string): string => {
    let domain = input.trim().toLowerCase();
    if (domain.startsWith('@')) {
      domain = domain.slice(1);
    }
    return domain;
  };

  const handleAddDomain = async () => {
    if (!organization || !newDomain.trim()) return;

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
      // Check if domain already exists for this org
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

      // Check if domain is a generic consumer email domain
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

      // Check if domain exists globally for another org
      const { data: existsGlobally, error: checkError } = await supabase.rpc(
        'domain_exists_for_other_org',
        { _domain: normalizedDomain, _org_id: organization.id }
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
          organization_id: organization.id,
          domain: normalizedDomain,
          verified: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setDomains([...domains, newDomainData]);
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
    // If this is the only domain and it's verified, prevent deletion
    if (domains.length <= 1 && domainToDelete.verified) {
      const verifiedCount = domains.filter((d) => d.verified).length;
      if (verifiedCount <= 1) {
        return { allowed: false, reason: 'Cannot delete the only verified domain. At least one verified domain must remain for automatic signups.' };
      }
    }

    // If deleting a verified domain, check if there will be at least one verified domain remaining
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

      setDomains(domains.filter((d) => d.id !== domain.id));
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
    // If toggling OFF (verified -> unverified), check if there will be at least one verified domain remaining
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

      setDomains(domains.map((d) => (d.id === domain.id ? { ...d, verified: newValue } : d)));
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

      {/* Organization Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Profile
          </CardTitle>
          <CardDescription>Update your organization's name and logo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Name */}
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <div className="flex gap-2">
              <Input
                id="org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Enter organization name"
              />
              <Button onClick={handleSaveName} disabled={saving || !orgName.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>

          {/* Organization Logo */}
          <div className="space-y-2">
            <Label>Organization Logo</Label>
            <div className="flex items-center gap-4">
              {organization?.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt="Organization logo"
                  className="h-16 w-16 rounded object-cover border"
                />
              ) : (
                <div className="h-16 w-16 rounded bg-muted flex items-center justify-center border">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {organization?.logo_url ? 'Change Logo' : 'Upload Logo'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Domains Card */}
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

      {/* Developer Notes */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            Developer Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>
              <strong>Storage bucket:</strong> Organization logos are stored in the{' '}
              <code className="bg-muted px-1 rounded">organization-logos</code> public storage bucket.
            </li>
            <li>
              <strong>Domain validation:</strong> The{' '}
              <code className="bg-muted px-1 rounded">domain_exists_for_other_org()</code> function
              checks if a domain is already claimed by another organization globally.
            </li>
            <li>
              <strong>Admin RLS policies:</strong> Only admins can update organization details and
              manage domains via RLS policies that check{' '}
              <code className="bg-muted px-1 rounded">has_role(auth.uid(), 'admin')</code>.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
