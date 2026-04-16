import { Plane, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginAction } from './actions';

export default async function LoginPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  const error = searchParams?.error;

  const errorMessage =
    error === 'invalid_credentials'
      ? 'Invalid email or password.'
    : error === 'invalid_input'
        ? 'Please enter a valid email and password.'
        : error === 'api_config'
          ? 'Web is missing API_BASE_URL. Set apps/web/.env API_BASE_URL=http://localhost:3001 and restart web.'
          : error === 'api_unreachable'
            ? 'API is unreachable. Ensure the Nest API is running on http://localhost:3001.'
            : error === 'api_error'
              ? 'API returned an unexpected error.'
              : error === 'unknown'
                ? 'Unexpected error. Check server logs.'
        : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Plane className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Sign in to AirTicket</CardTitle>
          <CardDescription>B2B air ticketing platform for agencies</CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMessage}
            </div>
          )}
          <form action={loginAction} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" name="email" type="email" placeholder="agent@agency.com" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">Sign in</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
