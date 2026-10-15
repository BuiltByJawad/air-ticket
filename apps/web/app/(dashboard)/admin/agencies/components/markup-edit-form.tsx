'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2, Loader2 } from 'lucide-react';
import { updateAgencyAction } from '../actions';
import { toast } from 'sonner';
import { fetchCsrfToken } from '@/components/shared/csrf-token-input';

interface MarkupEditFormProps {
  agencyId: string;
  currentMarkup: number;
}

export function MarkupEditForm({ agencyId, currentMarkup }: MarkupEditFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markup, setMarkup] = useState(currentMarkup.toString());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const csrfToken = await fetchCsrfToken();
      await updateAgencyAction(
        agencyId,
        { markupPercentage: parseFloat(markup) },
        csrfToken
      );
      toast.success('Agency markup updated successfully.');
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update markup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Edit2 className="h-4 w-4" />
          <span className="sr-only">Edit markup</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Agency Markup</DialogTitle>
            <DialogDescription>
              Set the markup percentage for this agency. This will be applied to all flight bookings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="markup">Markup Percentage (%)</Label>
              <Input
                id="markup"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={markup}
                onChange={(e) => setMarkup(e.target.value)}
                placeholder="e.g. 5.00"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
