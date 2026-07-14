import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Building2, Globe, Users, UsersRound, Target, CheckCircle, XCircle } from 'lucide-react';
import { usePlatformOrganizations } from '@/hooks/usePlatformOrganizations';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrganizationDetailDrawerProps {
  organizationId: string | null;
  onClose: () => void;
}

export function OrganizationDetailDrawer({
  organizationId,
  onClose,
}: OrganizationDetailDrawerProps) {
  const { getOrganizationDetail } = usePlatformOrganizations();
  const [detail, setDetail] = useState<Awaited<
    ReturnType<typeof getOrganizationDetail>
  > | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (organizationId) {
      setLoading(true);
      getOrganizationDetail(organizationId).then((data) => {
        setDetail(data);
        setLoading(false);
      });
    } else {
      setDetail(null);
    }
  }, [organizationId]);

  return (
    <Sheet open={!!organizationId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {detail?.logo_url ? (
              <img
                src={detail.logo_url}
                alt={detail.name}
                className="h-8 w-8 rounded object-cover"
              />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
            {detail?.name || 'Loading...'}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] mt-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : detail ? (
            <div className="space-y-6 pr-4">
              {/* Organization Info */}
              <div>
                <p className="text-sm text-muted-foreground">
                  Created {format(new Date(detail.created_at), 'MMMM d, yyyy')}
                </p>
              </div>

              {/* Domains */}
              <div>
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4" />
                  Domains ({detail.domains.length})
                </h3>
                <div className="space-y-1">
                  {detail.domains.map((domain) => (
                    <div
                      key={domain.id}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span>{domain.domain}</span>
                    {domain.verified ? (
                        <Badge variant="outline" className="text-primary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <XCircle className="h-3 w-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  ))}
                  {detail.domains.length === 0 && (
                    <p className="text-sm text-muted-foreground">No domains configured</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Users */}
              <div>
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  Users ({detail.users.length})
                </h3>
                <div className="space-y-1">
                  {detail.users.slice(0, 10).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <div>
                        <p className="font-medium">{user.name || 'Unnamed'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            user.status === 'active'
                              ? 'default'
                              : user.status === 'pending'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {user.status}
                        </Badge>
                        {user.roles.map((role) => (
                          <Badge key={role} variant="outline">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                  {detail.users.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center">
                      +{detail.users.length - 10} more users
                    </p>
                  )}
                  {detail.users.length === 0 && (
                    <p className="text-sm text-muted-foreground">No users</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Teams */}
              <div>
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <UsersRound className="h-4 w-4" />
                  Teams ({detail.teams.length})
                </h3>
                <div className="space-y-1">
                  {detail.teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span>{team.name}</span>
                      <Badge variant="outline">{team.member_count} members</Badge>
                    </div>
                  ))}
                  {detail.teams.length === 0 && (
                    <p className="text-sm text-muted-foreground">No teams</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Objectives */}
              <div>
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4" />
                  Objectives ({detail.objectives.length})
                </h3>
                <div className="space-y-1">
                  {detail.objectives.slice(0, 10).map((objective) => (
                    <div
                      key={objective.id}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="truncate flex-1">{objective.title}</span>
                      <Badge variant="outline">{objective.key_results_count} KRs</Badge>
                    </div>
                  ))}
                  {detail.objectives.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center">
                      +{detail.objectives.length - 10} more objectives
                    </p>
                  )}
                  {detail.objectives.length === 0 && (
                    <p className="text-sm text-muted-foreground">No objectives</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
