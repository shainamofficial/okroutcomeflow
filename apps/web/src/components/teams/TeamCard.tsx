import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2, UserMinus, Users } from 'lucide-react';
import { useTeamMembers } from '@/hooks/useTeams';
import { RenameTeamDialog } from './RenameTeamDialog';
import { DeleteTeamDialog } from './DeleteTeamDialog';
import { AddMemberDialog } from './AddMemberDialog';

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    created_at: string;
  };
  canManage: boolean;
  onRename: (teamId: string, name: string) => void;
  onDelete: (teamId: string) => void;
  isRenaming: boolean;
  isDeleting: boolean;
}

export function TeamCard({ 
  team, 
  canManage, 
  onRename, 
  onDelete,
  isRenaming,
  isDeleting,
}: TeamCardProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { members, membersLoading, addMember, removeMember } = useTeamMembers(team.id);

  const handleRename = (name: string) => {
    onRename(team.id, name);
    setRenameOpen(false);
  };

  const handleDelete = () => {
    onDelete(team.id);
    setDeleteOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{team.name}</CardTitle>
            <Badge variant="secondary">{members.length} members</Badge>
          </div>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDeleteOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <CardContent>
          {canManage && (
            <div className="mb-4">
              <AddMemberDialog
                teamId={team.id}
                existingMemberIds={members.map((m) => m.user_id)}
                onAddMember={(userId) => addMember.mutate({ teamId: team.id, userId })}
                isPending={addMember.isPending}
              />
            </div>
          )}
          
          {membersLoading ? (
            <p className="text-sm text-muted-foreground">Loading members...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-sm">{member.user?.name || 'Unnamed'}</p>
                    <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                  </div>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMember.mutate(member.id)}
                      disabled={removeMember.isPending}
                    >
                      <UserMinus className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RenameTeamDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        teamName={team.name}
        onRename={handleRename}
        isPending={isRenaming}
      />

      <DeleteTeamDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        teamName={team.name}
        memberCount={members.length}
        onDelete={handleDelete}
        isPending={isDeleting}
      />
    </>
  );
}
