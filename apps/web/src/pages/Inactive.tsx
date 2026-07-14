import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function Inactive() {
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <AuthLayout title="Account Inactive" subtitle="Your account has been deactivated">
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Your account is currently inactive. Please contact your organization administrator for assistance.
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
