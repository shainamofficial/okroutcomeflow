import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Building2, Globe, CheckCircle, XCircle, Info } from 'lucide-react';

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
}

export default function App() {
  const { profile, roles, signOut } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [domains, setDomains] = useState<OrganizationDomain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizationData = async () => {
      if (!profile?.organization_id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch organization
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .maybeSingle();

        if (orgError) {
          console.error('Error fetching organization:', orgError);
        } else if (orgData) {
          setOrganization(orgData);
        }

        // Fetch domains
        const { data: domainsData, error: domainsError } = await supabase
          .from('organization_domains')
          .select('*')
          .eq('organization_id', profile.organization_id);

        if (domainsError) {
          console.error('Error fetching domains:', domainsError);
        } else if (domainsData) {
          setDomains(domainsData);
        }
      } catch (error) {
        console.error('Error fetching organization data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationData();
  }, [profile?.organization_id]);

  const handleLogout = async () => {
    await signOut();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'manager':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">OutcomeFlow</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {profile?.name ? getInitials(profile.name) : profile?.email?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground hidden sm:inline">
                {profile?.name || profile?.email}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {profile?.name ? getInitials(profile.name) : '??'}
                </AvatarFallback>
              </Avatar>
              Your Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{profile?.name || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{profile?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <div className="flex gap-1 mt-1">
                  {roles.length > 0 ? (
                    roles.map((role) => (
                      <Badge key={role} variant={getRoleBadgeVariant(role)}>
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">No role</Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={profile?.status === 'active' ? 'default' : 'secondary'}>
                  {profile?.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization
            </CardTitle>
            <CardDescription>Your organization details</CardDescription>
          </CardHeader>
          <CardContent>
            {organization ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Organization Name</p>
                  <p className="text-sm font-medium">{organization.name}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No organization found</p>
            )}
          </CardContent>
        </Card>

        {/* Organization Domains Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Organization Domains
            </CardTitle>
            <CardDescription>Domains associated with your organization</CardDescription>
          </CardHeader>
          <CardContent>
            {domains.length > 0 ? (
              <ul className="space-y-2">
                {domains.map((domain) => (
                  <li
                    key={domain.id}
                    className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                  >
                    <span className="text-sm font-mono">{domain.domain}</span>
                    <div className="flex items-center gap-2">
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
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No domains found</p>
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
                <strong>Role storage:</strong> User roles are stored in a separate{' '}
                <code className="bg-muted px-1 rounded">user_roles</code> table (instead of the{' '}
                <code className="bg-muted px-1 rounded">users_profile</code> table) for security. This
                prevents privilege escalation attacks by using a security definer function{' '}
                <code className="bg-muted px-1 rounded">has_role()</code> to check permissions.
              </li>
              <li>
                <strong>Auto-provisioning:</strong> A database trigger on{' '}
                <code className="bg-muted px-1 rounded">auth.users</code> automatically creates
                organization, domain, profile, and role entries on signup.
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
