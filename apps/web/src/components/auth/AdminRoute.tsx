import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, profile, roles, loading } = useAuth();
  const { toast } = useToast();
  const hasShownToast = useRef(false);

  const isAdmin = roles.includes('admin');

  useEffect(() => {
    if (!loading && user && profile && !isAdmin && !hasShownToast.current) {
      hasShownToast.current = true;
      toast({
        title: 'No access',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });
    }
  }, [loading, user, profile, isAdmin, toast]);

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

  if (!isAdmin) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
