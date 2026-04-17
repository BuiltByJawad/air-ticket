import { Plane, AlertCircle, Building2, User, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/form-field';
import { registerAction } from './actions';
import { CleanErrorParam } from '../login/components/clean-error-param';
import Link from 'next/link';

export default async function RegisterPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const { error } = (await searchParams) ?? {};

  const errorMessage =
    error === 'invalid_email'
      ? 'Please enter a valid email address.'
      : error === 'short_password'
        ? 'Password must be at least 8 characters.'
        : error === 'password_mismatch'
          ? 'Passwords do not match.'
          : error === 'email_taken'
            ? 'An account with this email already exists.'
            : error === 'missing_agency'
              ? 'Agency name is required.'
              : error === 'terms_required'
                ? 'You must accept the terms of service.'
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

      {/* Right: Register form */}
      <div className="flex w-full items-center justify-center p-4 sm:p-6 lg:w-1/2 lg:p-12">
        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary lg:hidden">
              <Plane className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Create Agency Account</CardTitle>
            <CardDescription>Register your travel agency to get started</CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errorMessage}
              </div>
            )}
            <form action={registerAction} className="space-y-4">
              {/* Agency section */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agency Details</p>
                <FormField id="agencyName" label="Agency Name" required error={error === 'missing_agency' ? 'Agency name is required' : undefined}>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="agencyName" name="agencyName" type="text" placeholder="Acme Travel Agency" required className="pl-9" />
                  </div>
                </FormField>
              </div>

              {/* Personal section */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal Details</p>
                <FormField id="name" label="Full Name">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="name" name="name" type="text" placeholder="John Smith" className="pl-9" />
                  </div>
                </FormField>
                <FormField id="email" label="Email" required error={error === 'invalid_email' ? 'Enter a valid email address' : undefined}>
                  <Input id="email" name="email" type="email" placeholder="agent@agency.com" required className={error === 'invalid_email' ? 'border-destructive' : undefined} />
                </FormField>
                <FormField id="phone" label="Phone">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" className="pl-9" />
                  </div>
                </FormField>
              </div>

              {/* Security section */}
              <div className="space-y-4">
                <FormField id="password" label="Password" required error={error === 'short_password' ? 'At least 8 characters' : undefined}>
                  <Input id="password" name="password" type="password" placeholder="Min. 8 characters" required className={error === 'short_password' ? 'border-destructive' : undefined} />
                </FormField>
                <FormField id="confirmPassword" label="Confirm Password" required error={error === 'password_mismatch' ? 'Passwords do not match' : undefined}>
                  <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Re-enter password" required className={error === 'password_mismatch' ? 'border-destructive' : undefined} />
                </FormField>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  value="accepted"
                  required
                  className="mt-1 h-4 w-4 rounded border-input accent-primary"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug">
                  I agree to the{' '}
                  <span className="font-medium text-foreground">Terms of Service</span> and{' '}
                  <span className="font-medium text-foreground">Privacy Policy</span>
                </label>
              </div>

              <Button type="submit" className="w-full h-11 text-base font-semibold">Create Account</Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
