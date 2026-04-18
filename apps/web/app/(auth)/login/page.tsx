import { Plane } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoginForm } from './components/login-form';
import { CleanErrorParam } from './components/clean-error-param';
import Link from 'next/link';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Invalid email or password.',
  invalid_input: 'Please enter a valid email and password.',
  api_config: 'Web is missing API_BASE_URL. Set apps/web/.env API_BASE_URL=http://localhost:3001 and restart web.',
  api_unreachable: 'API is unreachable. Ensure the Nest API is running on http://localhost:3001.',
  api_error: 'API returned an unexpected error.',
  unknown: 'Unexpected error. Check server logs.',
};

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const { error } = (await searchParams) ?? {};
  const errorMessage = error ? ERROR_MESSAGES[error] ?? null : null;

  return (
    <div className="flex min-h-svh">
      <CleanErrorParam />
      {/* Left: Branding panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <Plane className="h-8 w-8" />
            <span className="text-2xl font-bold">AirTicket</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight">
            B2B Air Ticketing<br />Made Simple
          </h1>
          <p className="mt-4 text-blue-100 text-lg leading-relaxed max-w-md">
            Search, quote, and book flights for your customers from one platform. 
            Built for travel agencies who need speed, reliability, and compliance.
          </p>
        </div>
        <p className="text-sm text-blue-200">&copy; {new Date().getFullYear()} AirTicket Platform</p>
      </div>

      {/* Right: Login form */}
      <div className="flex w-full items-center justify-center p-4 sm:p-6 lg:w-1/2 lg:p-12">
        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary lg:hidden">
              <Plane className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Sign in to AirTicket</CardTitle>
            <CardDescription>B2B air ticketing platform for agencies</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm serverError={errorMessage} />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
