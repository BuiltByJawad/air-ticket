'use client';

import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BookingExportProps {
  status?: string;
  search?: string;
  onExportCsv: (input: { status?: string; search?: string; fromDate?: string; toDate?: string }) => Promise<{ csv: string; filename: string } | null>;
  onExportPdf: (input: { status?: string; search?: string; fromDate?: string; toDate?: string }) => Promise<{ base64: string; filename: string } | null>;
}

export function BookingExport({ status, search, onExportCsv, onExportPdf }: BookingExportProps) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  async function handleExportCsv() {
    setLoading('csv');
    try {
      const result = await onExportCsv({
        status,
        search,
        fromDate: fromDate || undefined,
        toDate: toDate ? new Date(toDate + 'T23:59:59').toISOString() : undefined
      });

      if (!result) return;

      const blob = new Blob([result.csv], { type: 'text/csv' });
      downloadBlob(blob, result.filename);
      toast.success('CSV exported');
    } catch {
      toast.error('Failed to export CSV');
    } finally {
      setLoading(null);
    }
  }

  async function handleExportPdf() {
    setLoading('pdf');
    try {
      const result = await onExportPdf({
        status,
        search,
        fromDate: fromDate || undefined,
        toDate: toDate ? new Date(toDate + 'T23:59:59').toISOString() : undefined
      });

      if (!result) return;

      const binary = atob(result.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      downloadBlob(blob, result.filename);
      toast.success('PDF exported');
    } catch {
      toast.error('Failed to export PDF');
    } finally {
      setLoading(null);
    }
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      <Button size="sm" variant="outline" className="gap-1 h-9" onClick={handleExportCsv} disabled={loading !== null}>
        <Download className="h-4 w-4" />
        {loading === 'csv' ? 'Exporting...' : 'CSV'}
      </Button>
      <Button size="sm" variant="outline" className="gap-1 h-9" onClick={handleExportPdf} disabled={loading !== null}>
        <FileText className="h-4 w-4" />
        {loading === 'pdf' ? 'Exporting...' : 'PDF'}
      </Button>
    </div>
  );
}
