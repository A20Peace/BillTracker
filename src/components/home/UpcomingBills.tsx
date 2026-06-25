import Link from "next/link";
import { Inbox, ArrowRight } from "lucide-react";
import { BillCard } from "@/components/bills/BillCard";
import { daysUntil } from "@/lib/utils";
import { isBenchmarkCategory, type Bill } from "@/types";
import type { BenchmarkAverages } from "@/lib/market/queries";

export function UpcomingBills({
  bills,
  benchmarkAverages,
}: {
  bills: Bill[];
  benchmarkAverages: BenchmarkAverages;
}) {
  const visible = bills.slice(0, 8);

  const avgFor = (b: Bill) =>
    isBenchmarkCategory(b.category) ? benchmarkAverages[b.category] : undefined;

  const overdue = visible.filter((b) => daysUntil(b.due_date) <= 0);
  const week = visible.filter((b) => {
    const d = daysUntil(b.due_date);
    return d > 0 && d <= 7;
  });
  const month = visible.filter((b) => {
    const d = daysUntil(b.due_date);
    return d > 7 && d <= 30;
  });
  const later = visible.filter((b) => daysUntil(b.due_date) > 30);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Prossime scadenze</h2>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
        >
          Vedi tutte <ArrowRight size={14} />
        </Link>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-12 text-center">
          <Inbox className="text-slate-300" size={40} />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Nessuna scadenza in arrivo. Sei in pari! 🎉
          </p>
        </div>
      ) : (
        <>
          <Band title="Da pagare ora" items={overdue} avgFor={avgFor} />
          <Band title="Entro 7 giorni" items={week} avgFor={avgFor} />
          <Band title="Entro 30 giorni" items={month} avgFor={avgFor} />
          <Band title="Più avanti" items={later} avgFor={avgFor} />
        </>
      )}
    </section>
  );
}

function Band({
  title,
  items,
  avgFor,
}: {
  title: string;
  items: Bill[];
  avgFor: (b: Bill) => number | undefined;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {items.map((b) => (
          <li key={b.id}>
            <BillCard bill={b} benchmarkAvg={avgFor(b)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
