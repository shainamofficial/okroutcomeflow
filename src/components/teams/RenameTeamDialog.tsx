import { useState, useEffect } from 'react';
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
} from '@/components/ui/dialog';

interface RenameTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamName: string;
  onRename: (name: string) => void;
  isPending: boolean;
}

export function RenameTeamDialog({ 
  open, 
  onOpenChange, 
  teamName, 
  onRename, 
  isPending 
}: RenameTeamDialogProps) {
  const [name, setName] = useState(teamName);

  useEffect(() => {
    setName(teamName);
  }, [teamName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === teamName) return;
    
    onRename(name);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Team</DialogTitle>
            <DialogDescription>
              Enter a new name for this team.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rename-team">Team Name</Label>
            <Input
              id="rename-team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Team name"
              className="mt-2"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || name.trim() === teamName || isPending}
            >
              {isPending ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
