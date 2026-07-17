import React, { createContext, useContext, useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';

interface PlatformAdminContextType {
  isPlatformAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PlatformAdminContext = createContext<PlatformAdminContextType | undefined>(undefined);

export function PlatformAdminProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPlatformAdmin = async () => {
    if (!user?.email) {
      setIsPlatformAdmin(false);
      setLoading(false);
      return;
    }

    try {
      setIsPlatformAdmin(await trpc.platform.amIAdmin.query());
    } catch (error) {
      console.error('Error checking platform admin status:', error);
      setIsPlatformAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPlatformAdmin();
  }, [user?.email]);

  const refresh = async () => {
    setLoading(true);
    await checkPlatformAdmin();
  };

  return (
    <PlatformAdminContext.Provider value={{ isPlatformAdmin, loading, refresh }}>
      {children}
    </PlatformAdminContext.Provider>
  );
}

export function usePlatformAdmin() {
  const context = useContext(PlatformAdminContext);
  if (context === undefined) {
    throw new Error('usePlatformAdmin must be used within a PlatformAdminProvider');
  }
  return context;
}
