export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="skeleton h-24 w-full rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-72 w-full rounded-2xl" />
      <div className="skeleton h-56 w-full rounded-2xl" />
    </div>
  );
}
