export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-24 rounded-md bg-muted" />
        <div className="h-4 w-40 rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 sm:p-6 space-y-3">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-6 w-32 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border p-4 sm:p-6 space-y-4">
        <div className="h-6 w-24 rounded bg-muted" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-5 w-28 rounded bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-5 w-28 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
