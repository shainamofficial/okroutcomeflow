import { LayoutDashboard, Building2, Users, UsersRound, Target, Lightbulb, CalendarClock, CalendarRange, CalendarDays, BarChart3, Activity, User, Shield, TableProperties, Zap, Bell, type LucideIcon } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformAdmin } from '@/contexts/PlatformAdminContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  description: string;
};

export function AppSidebar() {
  const { roles } = useAuth();
  const { isPlatformAdmin } = usePlatformAdmin();
  const isAdmin = roles.includes('admin');
  const isManager = roles.includes('manager');

  const navItems: NavItem[] = [
    { title: 'Dashboard', url: '/app', icon: LayoutDashboard, description: 'Org-wide health: objectives, KR status mix, overdue work.' },
    { title: 'My Items', url: '/app/me', icon: User, description: 'Everything assigned to you — KRs you own, initiatives, and tasks.' },
    { title: 'OKRs', url: '/app/okrs', icon: Target, description: 'Objectives and Key Results. The what-and-how-measured of strategy.' },
    { title: 'Initiatives', url: '/app/initiatives', icon: Lightbulb, description: 'The projects you run to move Key Results. Link each initiative to the KR it supports.' },
    { title: 'Table', url: '/app/table', icon: TableProperties, description: 'Spreadsheet view of initiatives with filters and custom fields — best for bulk edits.' },
    { title: 'Timeline', url: '/app/timeline', icon: CalendarRange, description: 'Gantt-style view of initiatives across time. Spot overlaps and gaps.' },
    { title: 'Calendar', url: '/app/calendar', icon: CalendarDays, description: 'Calendar view of due dates, reviews, and milestones.' },
    { title: 'Workload', url: '/app/workload', icon: BarChart3, description: 'Who is over- or under-allocated. Useful for rebalancing during planning.' },
    { title: 'Reviews', url: '/app/reviews', icon: CalendarClock, description: 'Scheduled check-ins where owners report KR progress. Drives the update cadence.' },
    { title: 'Activity Log', url: '/app/activity', icon: Activity, description: 'Audit trail of who changed what and when — across OKRs, initiatives, and tasks.' },
    { title: 'Automations', url: '/app/automations', icon: Zap, description: 'Rules that trigger on events — e.g., notify an owner when a KR goes At Risk.' },
    { title: 'Notifications', url: '/app/settings/notifications', icon: Bell, description: 'Choose which events you want to be notified about, and where.' },
  ];

  const managerItems: NavItem[] = (isAdmin || isManager)
    ? [
        { title: 'User Management', url: '/app/settings/users', icon: Users, description: 'Invite users, assign roles (admin / manager / contributor), activate or deactivate accounts.' },
        { title: 'Teams', url: '/app/settings/teams', icon: UsersRound, description: 'Group users into teams for ownership, filtering, and workload views.' },
      ]
    : [];

  const adminItems: NavItem[] = isAdmin
    ? [{ title: 'Organization Settings', url: '/app/settings/organization', icon: Building2, description: 'Org profile, cycles, custom fields, and workspace-level preferences.' }]
    : [];

  const platformItems: NavItem[] = isPlatformAdmin
    ? [{ title: 'Platform', url: '/platform', icon: Shield, description: 'Platform admin console — manage organizations and platform-level users.' }]
    : [];

  const renderMenu = (items: NavItem[]) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.url}
                  end
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150"
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  <span className="text-[13px]">{item.title}</span>
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs text-xs leading-relaxed">
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground">{item.description}</p>
              </TooltipContent>
            </Tooltip>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar className="border-r border-sidebar-border/60">
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 px-3 mb-1">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenu(navItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {managerItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 px-3 mb-1">
              Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenu(managerItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 px-3 mb-1">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenu(adminItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {platformItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 px-3 mb-1">
              Platform
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenu(platformItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
