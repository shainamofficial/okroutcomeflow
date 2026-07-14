import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

type UserStatus = 'pending' | 'active' | 'inactive';
type AppRole = 'admin' | 'manager' | 'contributor' | 'viewer';

interface UserProfile {
  id: string;
  organization_id: string | null;
  email: string;
  name: string;
  avatar_url: string | null;
  status: UserStatus;
  created_at: string;
}

interface UserRole {
  role: AppRole;
}

interface OrgMembership {
  id: string;
  organization_id: string;
  is_active: boolean;
  joined_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  roles: AppRole[];
  memberships: OrgMembership[];
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchOrganization: (targetOrgId: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      if (profileData) {
        setProfile(profileData as UserProfile);
      }

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        return;
      }

      if (rolesData) {
        setRoles(rolesData.map((r: UserRole) => r.role));
      }

      // Fetch organization memberships
      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_memberships')
        .select('id, organization_id, is_active, joined_at')
        .eq('user_id', userId);

      if (membershipError) {
        console.error('Error fetching memberships:', membershipError);
        return;
      }

      if (membershipData) {
        setMemberships(membershipData as OrgMembership[]);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // The setTimeout dodges supabase-js's deadlock when calling
          // client methods inside this callback. loading must only clear
          // AFTER the profile/roles are in state — clearing it earlier
          // made route guards evaluate an empty auth snapshot on direct
          // page loads and bounce authorized users to /app.
          setTimeout(() => {
            fetchProfile(session.user.id).finally(() => setLoading(false));
          }, 100);
        } else {
          setProfile(null);
          setRoles([]);
          setMemberships([]);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const domain = trimmedEmail.split('@')[1];

    if (!domain || domain.trim() === '') {
      return { error: new Error('Invalid email address') };
    }

    const { error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name: name.trim(),
        },
      },
    });

    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
    setMemberships([]);
  };

  const switchOrganization = async (targetOrgId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase.rpc('switch_organization', {
        _user_id: user.id,
        _target_org_id: targetOrgId,
      });

      if (error) return { error: new Error(error.message) };

      // Refresh profile, roles, and memberships
      await fetchProfile(user.id);

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Failed to switch organization') };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        memberships,
        loading,
        signUp,
        signIn,
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
