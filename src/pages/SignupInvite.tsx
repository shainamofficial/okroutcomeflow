import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
type InvitationStatus = Database['public']['Enums']['invitation_status'];

interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: AppRole;
  status: InvitationStatus;
}

export default function SignupInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingUser, setExistingUser] = useState(false);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('No invitation token provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .rpc('get_invitation_by_token', { _token: token });

        if (fetchError) throw fetchError;

        if (!data || data.length === 0) {
          setError('Invalid invitation token');
          setLoading(false);
          return;
        }

        const inv = data[0] as Invitation;

        if (inv.status === 'revoked') {
          setError('This invitation has been revoked');
          setLoading(false);
          return;
        }

        if (inv.status === 'accepted') {
          setError('This invitation has already been used');
          setLoading(false);
          return;
        }

        // Check if user already exists
        const { data: existingUserData } = await supabase
          .from('users_profile')
          .select('id')
          .eq('email', inv.email)
          .maybeSingle();

        if (existingUserData) {
          // Existing user — they need to log in to accept the invitation
          setExistingUser(true);
          setInvitation(inv);
          setLoading(false);
          return;
        }

        setInvitation(inv);
        setLoading(false);
      } catch (err) {
        console.error('Error validating token:', err);
        setError('Failed to validate invitation');
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  const handleAcceptAsExistingUser = async () => {
    if (!invitation || !token) return;
    setSubmitting(true);

    try {
      // Check if user is currently logged in
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Redirect to login with return URL
        toast({
          title: 'Please log in first',
          description: 'Sign in to accept this invitation and join the organization.',
        });
        navigate(`/login?redirect=${encodeURIComponent(`/signup-invite?token=${token}`)}`);
        return;
      }

      // Verify logged-in user email matches invitation
      if (session.user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
        toast({
          title: 'Email mismatch',
          description: `Please log in with ${invitation.email} to accept this invitation.`,
          variant: 'destructive',
        });
        return;
      }

      // Accept invitation as existing user
      const { error: acceptError } = await supabase.rpc('accept_invitation', {
        _user_id: session.user.id,
        _invitation_token: token,
        _name: '',
      });

      if (acceptError) throw acceptError;

      setSuccess(true);
      toast({
        title: 'Invitation accepted!',
        description: 'You can now switch to the new organization from the header.',
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Accept invitation error:', err);
      toast({
        title: 'Failed to accept invitation',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (!invitation) return;

    setSubmitting(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name: name.trim(),
            invitation_id: invitation.id,
            organization_id: invitation.organization_id,
            role: invitation.role,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const { error: acceptError } = await supabase.rpc('accept_invitation', {
        _user_id: authData.user.id,
        _invitation_token: token!,
        _name: name.trim(),
      });

      if (acceptError) {
        console.error('Accept invitation error:', acceptError);
        throw acceptError;
      }

      setSuccess(true);
      toast({
        title: 'Account created successfully!',
        description: 'You can now sign in to your account.',
      });

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Signup error:', err);
      toast({
        title: 'Failed to create account',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthLayout title="Loading..." subtitle="Validating your invitation">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthLayout>
    );
  }

  if (error) {
    return (
      <AuthLayout title="Invalid Invitation" subtitle={error}>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <Button variant="outline" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout title={existingUser ? 'Invitation Accepted!' : 'Account Created!'} subtitle={existingUser ? 'Redirecting to dashboard...' : 'Redirecting to login...'}>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <CheckCircle className="h-12 w-12 text-primary mb-4" />
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </AuthLayout>
    );
  }

  // Existing user flow: show accept invitation screen
  if (existingUser) {
    return (
      <AuthLayout
        title="Join Organization"
        subtitle={`You've been invited to join as a ${invitation?.role}`}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p>An account already exists for <span className="font-medium text-foreground">{invitation?.email}</span>.</p>
              <p className="mt-1">Log in to accept this invitation and join the new organization. You can switch between organizations from the header.</p>
            </div>
          </div>
          <Button onClick={handleAcceptAsExistingUser} className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              'Accept Invitation'
            )}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">
              Go to Login
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Complete Your Registration"
      subtitle={`You've been invited to join as a ${invitation?.role}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={invitation?.email || ''}
            disabled
            className="bg-muted"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
