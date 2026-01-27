import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserPlus } from 'lucide-react';
import { useOrgUsers } from '@/hooks/useOrgUsers';

interface AddMemberDialogProps {
  teamId: string;
  existingMemberIds: string[];
  onAddMember: (userId: string) => void;
  isPending: boolean;
}

export function AddMemberDialog({ 
  teamId, 
  existingMemberIds, 
  onAddMember, 
  isPending 
}: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { activeUsers } = useOrgUsers();

  const availableUsers = activeUsers.filter(
    (user) => !existingMemberIds.includes(user.id)
  );

  const filteredUsers = availableUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddMember = (userId: string) => {
    onAddMember(userId);
    setSearch('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Search for users by name or email to add to this team.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="user-search">Search Users</Label>
          <Input
            id="user-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="mt-2"
            autoFocus
          />
          <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {availableUsers.length === 0 
                  ? 'All active users are already members of this team'
                  : 'No users found matching your search'}
              </p>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-md border hover:bg-accent cursor-pointer"
                  onClick={() => handleAddMember(user.id)}
                >
                  <div>
                    <p className="font-medium">{user.name || 'Unnamed'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    disabled={isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddMember(user.id);
                    }}
                  >
                    Add
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
