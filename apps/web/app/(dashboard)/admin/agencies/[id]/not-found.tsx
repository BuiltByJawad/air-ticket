import Link from 'next/link';

export default function AgencyNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="text-xl font-semibold mb-2">Agency Not Found</h2>
      <p className="text-sm text-muted-foreground mb-6">The agency you are looking for does not exist or has been removed.</p>
      <Link href="/admin/agencies" className="text-sm text-primary hover:underline">
        Back to Agencies
      </Link>
    </div>
  );
}
