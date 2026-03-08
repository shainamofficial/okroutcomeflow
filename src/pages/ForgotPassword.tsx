import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="Password reset link sent">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            If an account exists for <span className="font-medium text-foreground">{email}</span>, you'll receive a password reset link shortly.
          </p>
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-foreground underline underline-offset-4 hover:text-primary">
            Back to sign in
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your email to receive a reset link">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link to="/login" className="text-foreground underline underline-offset-4 hover:text-primary">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
