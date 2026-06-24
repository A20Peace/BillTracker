import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="text-3xl">🧾</span>
        <span className="text-2xl font-bold tracking-tight text-slate-900">
          Bill<span className="text-brand-600">Tracker</span>
        </span>
      </Link>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200 sm:p-8">
        {children}
      </div>
      <p className="mt-6 max-w-md text-center text-xs text-slate-400">
        Non perdere mai più una scadenza. Carica una bolletta e lascia che
        BillTracker estragga importo e data per te.
      </p>
    </div>
  );
}
