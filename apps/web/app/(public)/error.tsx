'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mb-6">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-8">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
