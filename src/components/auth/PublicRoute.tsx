import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // If authenticated, redirect based on status
  if (user && profile) {
    if (profile.status === 'active') {
      return <Navigate to="/app" replace />;
    }
    if (profile.status === 'pending') {
      return <Navigate to="/awaiting-approval" replace />;
    }
    if (profile.status === 'inactive') {
      return <Navigate to="/inactive" replace />;
    }
  }

  return <>{children}</>;
}
