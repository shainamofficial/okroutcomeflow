import { useEffect, useState } from 'react';
import { LogOut, ChevronDown, Check, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { CommandPalette } from '@/components/search/CommandPalette';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { CreateOrganizationDialog } from '@/components/app/CreateOrganizationDialog';

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
}

export function AppHeader() {
  const { profile, memberships, signOut, switchOrganization } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [switching, setSwitching] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!profile?.organization_id) return;

      // Fetch current org
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, logo_url')
        .eq('id', profile.organization_id)
        .maybeSingle();

      if (!error && data) {
        setOrganization(data);
      }

      // Fetch all orgs user is a member of
      if (memberships.length > 1) {
        const orgIds = memberships.map((m) => m.organization_id);
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('id, name, logo_url')
          .in('id', orgIds);

        if (!orgsError && orgsData) {
          setAllOrgs(orgsData);
        }
      } else {
        setAllOrgs([]);
      }
    };

    fetchOrganizations();
  }, [profile?.organization_id, memberships]);

  const handleLogout = async () => {
    await signOut();
  };

  const handleSwitchOrg = async (targetOrgId: string) => {
    if (targetOrgId === profile?.organization_id || switching) return;
    setSwitching(true);
    try {
      const { error } = await switchOrganization(targetOrgId);
      if (error) {
        toast({ title: 'Failed to switch organization', description: error.message, variant: 'destructive' });
      } else {
        // Invalidate all queries to refresh data for new org
        queryClient.invalidateQueries();
        toast({ title: 'Organization switched' });
      }
    } finally {
      setSwitching(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const hasMultipleOrgs = allOrgs.length > 1;

  return (
    <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm h-12 sm:h-14 flex items-center px-2 sm:px-4 gap-2 sm:gap-3 sticky top-0 z-30">
      <SidebarTrigger className="-ml-0.5" />
      
      <Separator orientation="vertical" className="h-5" />

      {hasMultipleOrgs ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-auto py-1 px-2">
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
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              Switch Organization
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allOrgs.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSwitchOrg(org.id)}
                disabled={switching}
                className="flex items-center gap-2 cursor-pointer"
              >
                {org.logo_url ? (
                  <img
                    src={org.logo_url}
                    alt={org.name}
                    className="h-5 w-5 rounded object-cover"
                  />
                ) : (
                  <div className="h-5 w-5 rounded bg-accent flex items-center justify-center">
                    <span className="text-[8px] font-bold text-accent-foreground">
                      {getInitials(org.name)}
                    </span>
                  </div>
                )}
                <span className="flex-1 truncate text-sm">{org.name}</span>
                {org.id === profile?.organization_id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
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
      )}

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
