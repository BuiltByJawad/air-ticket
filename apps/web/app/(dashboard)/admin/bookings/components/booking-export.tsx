'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { exportBookingsCsvAction } from '../actions';

interface BookingExportProps {
  status?: string;
}

export function BookingExport({ status }: BookingExportProps) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const result = await exportBookingsCsvAction({
        status,
        fromDate: fromDate || undefined,
        toDate: toDate ? new Date(toDate + 'T23:59:59').toISOString() : undefined
      });

      if (!result) return;

      const blob = new Blob([result.csv], { type: 'text/csv' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch {
      // silently fail - could add toast notification later
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="from-date" className="text-xs">From</Label>
        <Input
          id="from-date"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="h-9 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="to-date" className="text-xs">To</Label>
        <Input
          id="to-date"
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="h-9 text-sm"
        />
      </div>
      <Button size="sm" variant="outline" className="gap-1 h-9" onClick={handleExport} disabled={loading}>
        <Download className="h-4 w-4" />
        {loading ? 'Exporting...' : 'Export CSV'}
      </Button>
    </div>
  );
}
