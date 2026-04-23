'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/form-field';
import { updateProfileAction, type ProfileActionResult } from '../actions';

interface ProfileEditFormProps {
  initialName: string | null;
  initialPhone: string | null;
}

export function ProfileEditForm({ initialName, initialPhone }: ProfileEditFormProps) {
  const [name, setName] = useState(initialName ?? '');
  const [phone, setPhone] = useState(initialPhone ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ProfileActionResult | null>(null);
  const [pending, setPending] = useState(false);

  function clearField(field: string) {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};

    if (password) {
      if (!currentPassword) {
        e.currentPassword = 'Current password is required to set a new password';
      }
      if (password.length < 8) {
        e.password = 'Password must be at least 8 characters';
      }
      if (!confirmPassword) {
        e.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        e.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setResult(null);

    if (!validate()) return;

    setPending(true);
    const formData = new FormData(ev.currentTarget);
    const actionResult = await updateProfileAction(formData);
    setResult(actionResult);
    setPending(false);

    if (actionResult.success) {
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
      toast.success('Profile updated');
    } else {
      toast.error(actionResult.error || 'Failed to update profile');
    }
  }

  return (
    <>
      {result && (
        <div className={`mb-4 flex items-center gap-2 rounded-md border p-3 text-sm ${
          result.success
            ? 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'
            : 'border-destructive/50 bg-destructive/10 text-destructive'
        }`}>
          {result.success
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />
          }
          {result.success ? 'Profile updated successfully' : result.error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField id="name" label="Full Name">
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="John Smith"
            value={name}
            onChange={(e) => { setName(e.target.value); clearField('name'); }}
          />
        </FormField>

        <FormField id="phone" label="Phone">
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); clearField('phone'); }}
          />
        </FormField>

        <div className="rounded-lg border bg-muted/30 p-3 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Change Password</p>
          <FormField id="currentPassword" label="Current Password" error={errors.currentPassword}>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); clearField('currentPassword'); }}
              className={errors.currentPassword ? 'border-destructive' : undefined}
            />
          </FormField>
          <FormField id="password" label="New Password" error={errors.password}>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearField('password'); }}
              className={errors.password ? 'border-destructive' : undefined}
            />
          </FormField>
          <FormField id="confirmPassword" label="Confirm New Password" error={errors.confirmPassword}>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); clearField('confirmPassword'); }}
              className={errors.confirmPassword ? 'border-destructive' : undefined}
            />
          </FormField>
        </div>

        <Button type="submit" disabled={pending} className="h-10 px-6">
          {pending ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </>
  );
}
