export default function BookingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-32 rounded-md bg-muted" />
          <div className="h-4 w-48 rounded-md bg-muted" />
        </div>
        <div className="h-10 w-28 rounded-md bg-muted" />
      </div>
      <div className="rounded-lg border p-4 sm:p-6 space-y-4">
        <div className="h-6 w-32 rounded bg-muted" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-3 w-24 rounded bg-muted" />
            </div>
            <div className="h-6 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
