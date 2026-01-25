import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Profile not loaded yet - wait for it
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  // Status gating
  if (profile.status === 'pending') {
    return <Navigate to="/awaiting-approval" replace />;
  }

  if (profile.status === 'inactive') {
    return <Navigate to="/inactive" replace />;
  }

  return <>{children}</>;
}
