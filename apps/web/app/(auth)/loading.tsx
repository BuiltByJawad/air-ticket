export default function AuthLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="animate-pulse space-y-4 w-full max-w-md p-4">
        <div className="h-8 w-48 mx-auto rounded-md bg-muted" />
        <div className="h-4 w-64 mx-auto rounded-md bg-muted" />
        <div className="space-y-3 pt-4">
          <div className="h-10 rounded-md bg-muted" />
          <div className="h-10 rounded-md bg-muted" />
          <div className="h-11 rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
}
