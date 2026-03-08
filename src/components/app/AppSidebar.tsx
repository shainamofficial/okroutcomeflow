import { LayoutDashboard, Building2, Users, UsersRound, Target, Lightbulb, CalendarClock, CalendarRange, CalendarDays, BarChart3, Activity, User, Shield, TableProperties, Zap } from 'lucide-react';
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

export function AppSidebar() {
  const { roles } = useAuth();
  const { isPlatformAdmin } = usePlatformAdmin();
  const isAdmin = roles.includes('admin');
  const isManager = roles.includes('manager');

  const navItems = [
    { title: 'Dashboard', url: '/app', icon: LayoutDashboard },
    { title: 'My Items', url: '/app/me', icon: User },
    { title: 'OKRs', url: '/app/okrs', icon: Target },
    { title: 'Initiatives', url: '/app/initiatives', icon: Lightbulb },
    { title: 'Table', url: '/app/table', icon: TableProperties },
    { title: 'Timeline', url: '/app/timeline', icon: CalendarRange },
    { title: 'Calendar', url: '/app/calendar', icon: CalendarDays },
    { title: 'Workload', url: '/app/workload', icon: BarChart3 },
    { title: 'Reviews', url: '/app/reviews', icon: CalendarClock },
    { title: 'Activity Log', url: '/app/activity', icon: Activity },
    { title: 'Automations', url: '/app/automations', icon: Zap },
  ];

  const managerItems = (isAdmin || isManager)
    ? [
        { title: 'User Management', url: '/app/settings/users', icon: Users },
        { title: 'Teams', url: '/app/settings/teams', icon: UsersRound },
      ]
    : [];

  const adminItems = isAdmin
    ? [{ title: 'Organization Settings', url: '/app/settings/organization', icon: Building2 }]
    : [];

  const platformItems = isPlatformAdmin
    ? [{ title: 'Platform', url: '/platform', icon: Shield }]
    : [];

  const renderMenu = (items: typeof navItems) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <NavLink
              to={item.url}
              end
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150"
              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span className="text-[13px]">{item.title}</span>
            </NavLink>
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
