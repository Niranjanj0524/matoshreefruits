/** Streaming fallback shown while a page's content loads. */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse px-4 py-10 sm:px-6 sm:py-14">
      <div className="h-3 w-28 rounded-full bg-brand-soft" />
      <div className="mt-4 h-9 w-2/3 rounded-xl bg-brand-soft/80" />
      <div className="mt-4 h-4 w-1/2 rounded-lg bg-surface ring-1 ring-line" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-56 rounded-2xl bg-surface ring-1 ring-line" />
        ))}
      </div>
    </div>
  );
}
