'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TicketDownloadProps {
  bookingId: string;
  onDownload: (id: string) => Promise<{ base64: string; filename: string } | null>;
}

export function TicketDownload({ bookingId, onDownload }: TicketDownloadProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const result = await onDownload(bookingId);
      if (!result) {
        throw new Error('Failed to generate ticket');
      }

      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${result.base64}`;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Ticket downloaded successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to download ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="gap-2" 
      onClick={handleDownload} 
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      Download Ticket
    </Button>
  );
}
