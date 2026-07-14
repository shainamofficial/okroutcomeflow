import { useTeams } from '@/hooks/useTeams';
import { CreateTeamDialog } from '@/components/teams/CreateTeamDialog';
import { TeamCard } from '@/components/teams/TeamCard';
import { Users } from 'lucide-react';

export default function TeamManagement() {
  const { teams, teamsLoading, canManage, createTeam, renameTeam, deleteTeam } = useTeams();

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            Organize your users into teams
          </p>
        </div>
        {canManage && (
          <CreateTeamDialog
            onCreateTeam={(name) => createTeam.mutate(name)}
            isPending={createTeam.isPending}
          />
        )}
      </div>

      {teamsLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading teams...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No teams yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first team to start organizing users.
          </p>
          {canManage && (
            <CreateTeamDialog
              onCreateTeam={(name) => createTeam.mutate(name)}
              isPending={createTeam.isPending}
            />
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              canManage={canManage}
              onRename={(teamId, name) => renameTeam.mutate({ teamId, name })}
              onDelete={(teamId) => deleteTeam.mutate(teamId)}
              isRenaming={renameTeam.isPending}
              isDeleting={deleteTeam.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
