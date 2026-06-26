export default function HomeLoading() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Center column: upcoming bills + month summary */}
      <div className="min-w-0 flex-1 space-y-8">
        <div className="space-y-3">
          <div className="skeleton h-6 w-44 rounded-lg" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 w-full rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-40 w-full rounded-2xl" />
      </div>

      {/* Right column: market panel */}
      <aside className="lg:w-72 lg:shrink-0">
        <div className="skeleton h-64 w-full rounded-2xl" />
      </aside>
    </div>
  );
}
