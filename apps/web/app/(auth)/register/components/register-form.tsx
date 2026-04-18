'use client';

import { useState } from 'react';
import { AlertCircle, Building2, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/form-field';
import { registerAction } from '../actions';

interface RegisterFormProps {
  serverError: string | null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function RegisterForm({ serverError }: RegisterFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function clearField(field: string) {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');
    const agencyName = String(formData.get('agencyName') ?? '').trim();
    const terms = formData.get('terms');

    const fieldErrors: Record<string, string> = {};

    if (!agencyName) fieldErrors.agencyName = 'Agency name is required';
    if (!email) {
      fieldErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      fieldErrors.email = 'Enter a valid email address';
    }
    if (!password) {
      fieldErrors.password = 'Password is required';
    } else if (password.length < 8) {
      fieldErrors.password = 'Password must be at least 8 characters';
    }
    if (!confirmPassword) {
      fieldErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      fieldErrors.confirmPassword = 'Passwords do not match';
    }
    if (!terms) {
      fieldErrors.terms = 'You must accept the terms';
    }

    if (Object.keys(fieldErrors).length > 0) {
      e.preventDefault();
      setErrors(fieldErrors);
      return;
    }

    // Let form submit naturally so server action redirect works
  }

  return (
    <>
      {serverError && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}
      <form action={registerAction} onSubmit={handleSubmit} className="space-y-4">
        {/* Agency section */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agency Details</p>
          <FormField id="agencyName" label="Agency Name" required error={errors.agencyName}>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="agencyName"
                name="agencyName"
                type="text"
                placeholder="Acme Travel Agency"
                onChange={() => clearField('agencyName')}
                className={errors.agencyName ? 'border-destructive pl-9' : 'pl-9'}
              />
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
          <FormField id="email" label="Email" required error={errors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="agent@agency.com"
              onChange={() => clearField('email')}
              className={errors.email ? 'border-destructive' : undefined}
            />
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
          <FormField id="password" label="Password" required error={errors.password}>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              onChange={() => clearField('password')}
              className={errors.password ? 'border-destructive' : undefined}
            />
          </FormField>
          <FormField id="confirmPassword" label="Confirm Password" required error={errors.confirmPassword}>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              onChange={() => clearField('confirmPassword')}
              className={errors.confirmPassword ? 'border-destructive' : undefined}
            />
          </FormField>
        </div>

        {/* Terms */}
        <div>
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              name="terms"
              value="accepted"
              onChange={() => clearField('terms')}
              className="mt-1 h-4 w-4 rounded border-input accent-primary"
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug">
              I agree to the{' '}
              <span className="font-medium text-foreground">Terms of Service</span> and{' '}
              <span className="font-medium text-foreground">Privacy Policy</span>
            </label>
          </div>
          {errors.terms && <p className="text-xs text-destructive mt-1 ml-6">{errors.terms}</p>}
        </div>

        <Button type="submit" className="w-full h-11 text-base font-semibold">Create Account</Button>
      </form>
    </>
  );
}
