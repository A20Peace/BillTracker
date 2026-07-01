import { PublicNav } from "@/components/layout/PublicNav";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50 to-slate-50 dark:from-slate-950 dark:to-slate-900">
      <PublicNav />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 sm:p-8">
          {children}
        </div>
        <p className="mt-6 max-w-md text-center text-xs text-slate-400 dark:text-slate-500">
          Non perdere mai più una scadenza. Carica una bolletta e lascia che
          BillTracker estragga importo e data per te.
        </p>
      </div>
    </div>
  );
}
