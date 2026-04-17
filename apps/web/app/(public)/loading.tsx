export default function PublicLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-4">
          <div className="h-6 w-48 rounded-md bg-white/20" />
          <div className="h-12 w-72 rounded-md bg-white/20" />
          <div className="h-6 w-96 rounded-md bg-white/20" />
        </div>
      </section>
    </div>
  );
}
