import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PaginationMeta } from '@/lib/api/api-client';

interface PaginationControlsProps {
  basePath: string;
  meta: PaginationMeta;
  params?: Record<string, string | undefined>;
}

function buildHref(basePath: string, params: URLSearchParams): string {
  const q = params.toString();
  return q ? `${basePath}?${q}` : basePath;
}

export function PaginationControls({ basePath, meta, params }: PaginationControlsProps) {
  const hasPrev = meta.offset > 0;
  const hasNext = meta.offset + meta.limit < meta.total;

  const baseParams = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') baseParams.set(k, v);
    }
  }

  baseParams.set('limit', String(meta.limit));

  const prevOffset = Math.max(0, meta.offset - meta.limit);
  const nextOffset = meta.offset + meta.limit;

  const prevParams = new URLSearchParams(baseParams);
  prevParams.set('offset', String(prevOffset));
  const nextParams = new URLSearchParams(baseParams);
  nextParams.set('offset', String(nextOffset));

  const page = Math.floor(meta.offset / meta.limit) + 1;
  const totalPages = meta.limit > 0 ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages} · {meta.total} total
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={buildHref(basePath, prevParams)}
          aria-disabled={!hasPrev}
          tabIndex={hasPrev ? 0 : -1}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            !hasPrev && 'pointer-events-none opacity-50'
          )}
        >
          Prev
        </Link>
        <Link
          href={buildHref(basePath, nextParams)}
          aria-disabled={!hasNext}
          tabIndex={hasNext ? 0 : -1}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            !hasNext && 'pointer-events-none opacity-50'
          )}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
