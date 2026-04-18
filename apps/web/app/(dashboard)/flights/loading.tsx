export default function FlightsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-40 rounded-md bg-muted" />
        <div className="h-4 w-56 rounded-md bg-muted" />
      </div>
      <div className="rounded-lg border p-4 sm:p-6 space-y-4">
        <div className="h-10 w-48 rounded-md bg-muted" />
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <div className="h-20 rounded-md bg-muted" />
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="h-20 rounded-md bg-muted" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <div className="h-10 rounded-md bg-muted" />
          <div className="h-10 rounded-md bg-muted" />
          <div className="h-10 w-32 rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
}
