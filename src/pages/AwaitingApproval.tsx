import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

export default function AwaitingApproval() {
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <AuthLayout title="Awaiting Approval" subtitle="Your account is pending review">
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Your account is awaiting approval from an administrator.
          </p>
          {profile?.email && (
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{profile.email}</span>
            </p>
          )}
        </div>
        <Button variant="outline" onClick={handleLogout} className="w-full">
          Sign out
        </Button>
      </div>
    </AuthLayout>
  );
}
