export default function BookingDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 rounded-md bg-muted" />
        <div className="space-y-2">
          <div className="h-7 w-44 rounded-md bg-muted" />
          <div className="h-4 w-64 rounded-md bg-muted" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 sm:p-6 space-y-3">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-8 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border p-4 sm:p-6 space-y-4">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="h-20 rounded-md bg-muted" />
      </div>
    </div>
  );
}
