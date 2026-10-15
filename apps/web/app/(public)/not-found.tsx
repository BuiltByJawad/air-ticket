'use client';

import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function PublicNotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-4 text-center">
      <div className="flex flex-col items-center max-w-md">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">404 - Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Go to Home
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
            Login to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
