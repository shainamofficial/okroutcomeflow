import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';

type AppRole = 'admin' | 'manager' | 'contributor' | 'viewer';
type InvitationStatus = 'pending' | 'accepted' | 'revoked';

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
  const { user, signUp, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [success, setSuccess] = useState(false);

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
        const inv = (await trpc.invitations.byToken.query({ token })) as Invitation | null;

        if (!inv) {
          // byToken already filters out expired tokens, so a null here means
          // the token is unknown or lapsed.
          setError('This invitation link is invalid or has expired');
          setLoading(false);
          return;
        }

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

        setInvitation(inv);
        setLoading(false);
      } catch (err) {
        console.error('Error validating token:', err);
        setError('Failed to validate invitation');
        setLoading(false);
      }
    }

    void validateToken();
  }, [token]);

  const acceptInvitation = async (personName: string) => {
    if (!token) return;
    await trpc.invitations.accept.mutate({ token, name: personName });
    // Pull in the freshly-added membership/role so the header + guards update.
    await refreshProfile();
  };

  // Already signed in as the invited person: one click to join.
  const handleAcceptAsCurrentUser = async () => {
    setSubmitting(true);
    try {
      await acceptInvitation('');
      setSuccess(true);
      toast({
        title: 'Invitation accepted!',
        description: 'You can now switch to the new organization from the header.',
      });
      setTimeout(() => navigate('/app'), 1500);
    } catch (err) {
      toast({
        title: 'Failed to accept invitation',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // New person: create the account (Better Auth signs them in), then accept.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;

    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
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

    setSubmitting(true);
    try {
      const { error: signUpError } = await signUp(invitation.email, password, name.trim());
      if (signUpError) {
        const alreadyExists = /exist|registered|taken/i.test(signUpError.message);
        toast({
          title: alreadyExists ? 'Account already exists' : 'Failed to create account',
          description: alreadyExists
            ? 'Sign in first, then reopen this invitation link to accept it.'
            : signUpError.message,
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }

      await acceptInvitation(name.trim());
      setSuccess(true);
      toast({
        title: 'Account created!',
        description: "You've joined the organization.",
      });
      setTimeout(() => navigate('/app'), 1500);
    } catch (err) {
      toast({
        title: 'Failed to accept invitation',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
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
      <AuthLayout title="Invitation Accepted!" subtitle="Redirecting...">
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <CheckCircle className="h-12 w-12 text-primary mb-4" />
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </AuthLayout>
    );
  }

  const invitedEmail = invitation?.email ?? '';
  const signedInMatches = user && user.email.toLowerCase() === invitedEmail.toLowerCase();
  const signedInDiffers = user && !signedInMatches;

  // Signed in as the invited person — offer a one-click accept.
  if (signedInMatches) {
    return (
      <AuthLayout title="Join Organization" subtitle={`You've been invited as a ${invitation?.role}`}>
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p>
                Accept this invitation to join the organization as{' '}
                <span className="font-medium text-foreground">{invitation?.email}</span>. You can
                switch between organizations from the header.
              </p>
            </div>
          </div>
          <Button onClick={handleAcceptAsCurrentUser} className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              'Accept Invitation'
            )}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // Signed in as someone else — the emails must match to accept.
  if (signedInDiffers) {
    return (
      <AuthLayout title="Wrong account" subtitle={`This invite is for ${invitedEmail}`}>
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              You're signed in as{' '}
              <span className="font-medium text-foreground">{user?.email}</span>. Sign in as{' '}
              <span className="font-medium text-foreground">{invitedEmail}</span> to accept this
              invitation.
            </p>
          </div>
          <Button variant="outline" asChild className="w-full">
            <Link to="/login">Go to Login</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // Not signed in — create the account for the invited email.
  return (
    <AuthLayout
      title="Complete Your Registration"
      subtitle={`You've been invited to join as a ${invitation?.role}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={invitedEmail} disabled className="bg-muted" />
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
            disabled={submitting}
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
            disabled={submitting}
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
            disabled={submitting}
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
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-foreground underline underline-offset-4 hover:text-primary">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
