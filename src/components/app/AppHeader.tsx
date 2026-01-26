import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
}

export function AppHeader() {
  const { profile, signOut } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!profile?.organization_id) return;

      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, logo_url')
        .eq('id', profile.organization_id)
        .maybeSingle();

      if (!error && data) {
        setOrganization(data);
      }
    };

    fetchOrganization();
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

  return (
    <header className="border-b border-border bg-card h-14 flex items-center px-4 gap-4">
      <SidebarTrigger className="-ml-1" />
      
      <div className="flex items-center gap-2 flex-1">
        {organization?.logo_url ? (
          <img
            src={organization.logo_url}
            alt={organization.name}
            className="h-8 w-8 rounded object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {organization?.name ? getInitials(organization.name) : 'O'}
            </span>
          </div>
        )}
        <span className="font-semibold text-foreground">
          {organization?.name || 'Organization'}
        </span>
      </div>

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
    </header>
  );
}
