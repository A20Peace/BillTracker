export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton h-40 w-full rounded-2xl" />
      ))}
    </div>
  );
}
