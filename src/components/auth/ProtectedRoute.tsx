import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const PROFILE_TIMEOUT_MS = 15000;

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, profile, loading, signOut } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!user || profile || loading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), PROFILE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [user, profile, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    if (timedOut) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-4 text-center">
          <p className="text-foreground font-medium">Something went wrong loading your profile.</p>
          <p className="text-sm text-muted-foreground">Please try signing out and back in. If the issue persists, contact support.</p>
          <Button variant="outline" onClick={() => signOut()}>Sign out</Button>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (profile.status === 'pending') {
    return <Navigate to="/awaiting-approval" replace />;
  }

  if (profile.status === 'inactive') {
    return <Navigate to="/inactive" replace />;
  }

  return <>{children}</>;
}
