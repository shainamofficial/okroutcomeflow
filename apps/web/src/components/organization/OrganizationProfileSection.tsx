import { useRef, useState } from 'react';
import { trpc, API_URL } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Upload, Loader2 } from 'lucide-react';
import type { Organization } from './types';

interface OrganizationProfileSectionProps {
  organization: Organization;
  onOrganizationChange: (org: Organization) => void;
}

export function OrganizationProfileSection({
  organization,
  onOrganizationChange,
}: OrganizationProfileSectionProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [orgName, setOrgName] = useState(organization.name);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleSaveName = async () => {
    if (!orgName.trim()) {
      toast({
        title: 'Error',
        description: 'Organization name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await trpc.organizations.update.mutate({ name: orgName.trim() });

      onOrganizationChange({ ...organization, name: orgName.trim() });
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
    if (!file) return;

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
      // Streamed to R2 through the API; it stores the object key and returns
      // the stable display URL (a redirect endpoint with a cache-buster).
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_URL}/files/org-logo`, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Upload failed (${res.status})`);
      }
      const { logo_url } = (await res.json()) as { logo_url: string };

      onOrganizationChange({ ...organization, logo_url });
      toast({
        title: 'Success',
        description: 'Logo uploaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload logo.',
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
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
            {organization.logo_url ? (
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
                {organization.logo_url ? 'Change Logo' : 'Upload Logo'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
