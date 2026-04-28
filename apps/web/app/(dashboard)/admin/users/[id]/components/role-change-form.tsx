'use client';

import { useState } from 'react';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { updateUserAction } from '../../actions';
import { fetchCsrfToken } from '@/components/shared/csrf-token-input';

export function RoleChangeForm({
  userId,
  currentRole,
  userName
}: {
  userId: string;
  currentRole: string;
  userName: string;
}) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'agent' | 'admin'>(currentRole as 'agent' | 'admin');
  const [loading, setLoading] = useState(false);

  const newRole = selectedRole === 'admin' ? 'admin' : 'agent';
  const isChanged = newRole !== currentRole;

  async function handleRoleChange() {
    if (!isChanged) return;
    setLoading(true);
    try {
      const csrfToken = await fetchCsrfToken();
      await updateUserAction(userId, { role: newRole }, csrfToken);
      setOpen(false);
      toast.success(`Role changed to ${newRole}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change role');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Shield className="h-4 w-4" />
          Change Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Change the role for {userName || 'this user'}. This affects which routes and API endpoints they can access.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Role</Label>
            <div className="text-sm text-muted-foreground capitalize">{currentRole}</div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-select">New Role</Label>
            <select
              id="role-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'agent' | 'admin')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="agent">Agent — can search flights, create bookings, manage own bookings</option>
              <option value="admin">Admin — can manage agencies, users, view audit logs, see all bookings</option>
            </select>
          </div>
          {isChanged && newRole === 'admin' && (
            <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-400">
              Promoting to admin will remove this user&apos;s agency assignment. Admins do not belong to any agency.
            </div>
          )}
          {isChanged && newRole === 'agent' && (
            <div className="rounded-md border border-blue-500/50 bg-blue-500/10 p-3 text-sm text-blue-600 dark:text-blue-400">
              Demoting to agent requires assigning an agency. Please update the agency after changing the role.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleRoleChange} disabled={loading || !isChanged}>
            {loading ? 'Changing...' : 'Change Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
