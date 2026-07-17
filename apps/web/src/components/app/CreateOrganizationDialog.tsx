import { useState } from 'react';
import { Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function CreateOrganizationDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { refreshProfile, switchOrganization } = useAuth();
  const queryClient = useQueryClient();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const { id: newOrgId } = await trpc.organizations.create.mutate({ name: name.trim() });

      await refreshProfile();
      toast({ title: 'Organization created successfully' });
      setName('');
      setOpen(false);

      // Offer to switch to the newly created org.
      if (newOrgId) {
        const { error: switchError } = await switchOrganization(newOrgId);
        if (!switchError) {
          queryClient.invalidateQueries();
          toast({ title: 'Switched to new organization' });
        }
      }
    } catch (error) {
      toast({
        title: 'Failed to create organization',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground">
          <Plus className="h-4 w-4" />
          <span>Create Organization</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Create a new organization. You'll be assigned as admin.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Input
            placeholder="Organization name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || loading}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
