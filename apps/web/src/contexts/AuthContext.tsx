import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc';
import { useQueryClient } from '@tanstack/react-query';

type UserStatus = 'pending' | 'active' | 'inactive';
type AppRole = 'admin' | 'manager' | 'contributor' | 'viewer';

interface AuthUser {
  id: string;
  email: string;
}

interface UserProfile {
  id: string;
  organization_id: string | null;
  email: string;
  name: string;
  avatar_url: string | null;
  status: UserStatus;
  created_at: string;
}

interface OrgMembership {
  id: string;
  organization_id: string;
  is_active: boolean;
  joined_at: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  roles: AppRole[];
  memberships: OrgMembership[];
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchOrganization: (targetOrgId: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const queryClient = useQueryClient();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);

  const sessionUser = session?.user;
  const user: AuthUser | null = sessionUser
    ? { id: sessionUser.id, email: sessionUser.email }
    : null;
  const userId = sessionUser?.id ?? null;

  // Tracks the id whose profile is loaded, so `loading` reflects reality.
  const loadedFor = useRef<string | null>(null);

  const loadProfile = useCallback(async (id: string) => {
    setProfileLoading(true);
    try {
      const me = await trpc.session.me.query();
      setProfile((me.profile as UserProfile | null) ?? null);
      setRoles(me.roles as AppRole[]);
      setMemberships(me.memberships as OrgMembership[]);
      loadedFor.current = id;
    } catch (error) {
      console.error('Error loading session profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      if (loadedFor.current !== userId) void loadProfile(userId);
    } else {
      setProfile(null);
      setRoles([]);
      setMemberships([]);
      loadedFor.current = null;
    }
  }, [userId, loadProfile]);

  // loading stays true until the session resolves AND (if signed in) the
  // profile is loaded — route guards must never see a half-populated auth.
  const loading = isPending || (!!userId && loadedFor.current !== userId);

  const refreshProfile = useCallback(async () => {
    if (userId) await loadProfile(userId);
  }, [userId, loadProfile]);

  const signUp = async (email: string, password: string, name: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.split('@')[1]) return { error: new Error('Invalid email address') };
    const { error } = await authClient.signUp.email({
      email: trimmedEmail,
      password,
      name: name.trim(),
    });
    return { error: error ? new Error(error.message ?? 'Sign up failed') : null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await authClient.signIn.email({
      email: email.trim().toLowerCase(),
      password,
    });
    return { error: error ? new Error(error.message ?? 'Sign in failed') : null };
  };

  const signInWithGoogle = async () => {
    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: `${window.location.origin}/app`,
    });
    return { error: error ? new Error(error.message ?? 'Google sign-in failed') : null };
  };

  const signOut = async () => {
    await authClient.signOut();
    setProfile(null);
    setRoles([]);
    setMemberships([]);
    loadedFor.current = null;
    queryClient.clear();
  };

  const switchOrganization = async (targetOrgId: string) => {
    if (!userId) return { error: new Error('Not authenticated') };
    try {
      await trpc.session.switchOrganization.mutate({ targetOrgId });
      await loadProfile(userId);
      queryClient.invalidateQueries();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Failed to switch organization') };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        roles,
        memberships,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshProfile,
        switchOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
