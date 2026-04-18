import Link from 'next/link';

export default function AuthNotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <h2 className="text-xl font-semibold mb-2">Page not found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
