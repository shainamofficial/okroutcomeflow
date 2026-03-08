import { useEffect, useState } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { CommandPalette } from '@/components/search/CommandPalette';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Separator } from '@/components/ui/separator';

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
    <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm h-12 sm:h-14 flex items-center px-2 sm:px-4 gap-2 sm:gap-3 sticky top-0 z-30">
      <SidebarTrigger className="-ml-0.5" />
      
      <Separator orientation="vertical" className="h-5" />

      <div className="flex items-center gap-2">
        {organization?.logo_url ? (
          <img
            src={organization.logo_url}
            alt={organization.name}
            className="h-7 w-7 rounded-md object-cover"
          />
        ) : (
          <div className="h-7 w-7 rounded-md gradient-primary flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary-foreground">
              {organization?.name ? getInitials(organization.name) : 'O'}
            </span>
          </div>
        )}
        <span className="font-semibold text-sm text-foreground hidden sm:inline">
          {organization?.name || 'Organization'}
        </span>
      </div>

      <div className="flex-1 flex justify-center">
        <CommandPalette />
      </div>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <NotificationBell />
        <Separator orientation="vertical" className="h-5 mx-1" />
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 ring-2 ring-background">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-[10px] font-semibold bg-accent text-accent-foreground">
              {profile?.name ? getInitials(profile.name) : profile?.email?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground hidden md:inline">
            {profile?.name || profile?.email}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
