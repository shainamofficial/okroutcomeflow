import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformAdmin } from '@/contexts/PlatformAdminContext';
import { Loader2, ShieldX } from 'lucide-react';

interface PlatformAdminRouteProps {
  children: React.ReactNode;
}

export function PlatformAdminRoute({ children }: PlatformAdminRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isPlatformAdmin, loading: platformLoading } = usePlatformAdmin();

  if (authLoading || platformLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isPlatformAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <ShieldX className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">No Access</h1>
        <p className="text-muted-foreground">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
