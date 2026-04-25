'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/api/api-client';
import { forgotPasswordSchema } from '@/lib/validators/schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [devToken, setDevToken] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const parsed = forgotPasswordSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setLoading(true);
    try {
      const result = await forgotPassword(parsed.data.email);
      setSent(true);
      if (result.token) {
        setDevToken(result.token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request reset');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If an account with that email exists, a password reset token has been generated.
              </p>
              {devToken && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Development mode — use this token to reset:</p>
                  <pre className="text-xs bg-muted rounded p-2 break-all">{devToken}</pre>
                  <Link href={`/reset-password?token=${devToken}`}>
                    <Button size="sm" className="mt-2">Reset Password</Button>
                  </Link>
                </div>
              )}
              <Link href="/login" className="text-sm text-primary hover:underline block">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <Link href="/login" className="text-sm text-primary hover:underline block text-center">
                Back to login
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
