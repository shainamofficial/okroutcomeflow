import { Building2, Users, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizationsTable } from '@/components/platform/OrganizationsTable';
import { GlobalUsersTable } from '@/components/platform/GlobalUsersTable';
import { PlatformAdminManager } from '@/components/platform/PlatformAdminManager';

export default function Platform() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Management</h1>
        <p className="text-muted-foreground">
          Manage all organizations, users, and platform administrators.
        </p>
      </div>

      <Tabs defaultValue="organizations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Global Users
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Platform Admins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizations">
          <OrganizationsTable />
        </TabsContent>

        <TabsContent value="users">
          <GlobalUsersTable />
        </TabsContent>

        <TabsContent value="admins">
          <PlatformAdminManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
