'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateUserAction, deleteUserAction } from '../actions';

interface AgencyOption {
  id: string;
  name: string;
}

export function UserActions({
  id,
  name,
  phone,
  agencyId,
  agencies
}: {
  id: string;
  name: string | null;
  phone: string | null;
  agencyId: string | null;
  agencies: AgencyOption[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editName, setEditName] = useState(name ?? '');
  const [editPhone, setEditPhone] = useState(phone ?? '');
  const [editAgencyId, setEditAgencyId] = useState(agencyId ?? '');
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    setLoading(true);
    try {
      const data: { name?: string; phone?: string; agencyId?: string } = {};
      if (editName) data.name = editName;
      if (editPhone) data.phone = editPhone;
      if (editAgencyId) data.agencyId = editAgencyId;
      await updateUserAction(id, data);
      setEditOpen(false);
      toast.success('User updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteUserAction(id);
      setDeleteOpen(false);
      toast.success('User deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit user">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Name</Label>
              <Input id="user-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-phone">Phone</Label>
              <Input id="user-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-agency">Agency</Label>
              <select
                id="user-agency"
                value={editAgencyId}
                onChange={(e) => setEditAgencyId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">No agency</option>
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" aria-label="Delete user">
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
