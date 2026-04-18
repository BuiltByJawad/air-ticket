'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/form-field';
import { loginAction } from '../actions';

interface LoginFormProps {
  serverError: string | null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function LoginForm({ serverError }: LoginFormProps) {
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

    const fieldErrors: Record<string, string> = {};
    if (!email) {
      fieldErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      fieldErrors.email = 'Enter a valid email address';
    }
    if (!password) {
      fieldErrors.password = 'Password is required';
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
      <form action={loginAction} onSubmit={handleSubmit} className="space-y-4">
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
        <FormField id="password" label="Password" required error={errors.password}>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            onChange={() => clearField('password')}
            className={errors.password ? 'border-destructive' : undefined}
          />
        </FormField>
        <Button type="submit" className="w-full h-11 text-base font-semibold">Sign in</Button>
      </form>
    </>
  );
}
