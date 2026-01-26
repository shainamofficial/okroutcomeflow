import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';

interface ManagerRouteProps {
  children: React.ReactNode;
}

export function ManagerRoute({ children }: ManagerRouteProps) {
  const { roles, loading, profile } = useAuth();
  const hasShownToast = useRef(false);

  const isAdminOrManager = roles.includes('admin') || roles.includes('manager');

  useEffect(() => {
    if (!loading && profile && !isAdminOrManager && !hasShownToast.current) {
      hasShownToast.current = true;
      toast({
        title: 'No access',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });
    }
  }, [loading, profile, isAdminOrManager]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile || profile.status !== 'active') {
    return <Navigate to="/login" replace />;
  }

  if (!isAdminOrManager) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
