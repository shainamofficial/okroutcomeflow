import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { authClient } from '@/lib/auth-client';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Better Auth puts the reset token in the redirect URL query string.
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (!token) {
      toast({ title: 'Invalid or missing reset link', variant: 'destructive' });
      return;
    }
    setLoading(true);

    const { error } = await authClient.resetPassword({ newPassword: password, token });

    if (error) {
      toast({ title: 'Error', description: error.message ?? 'Reset failed', variant: 'destructive' });
      setLoading(false);
      return;
    }

    toast({ title: 'Password updated', description: 'You can now sign in with your new password.' });
    navigate('/login');
  };

  if (!token) {
    return (
      <AuthLayout title="Reset password" subtitle="Invalid reset link">
        <p className="text-sm text-muted-foreground text-center py-4">
          This password reset link is missing or invalid. Request a new one from the sign-in page.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set new password" subtitle="Enter your new password below">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Updating...' : 'Update password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
