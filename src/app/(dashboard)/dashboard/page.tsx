import Link from "next/link";
import { Plus, Inbox } from "lucide-react";
import { BillCard } from "@/components/bills/BillCard";
import { BillFilters } from "@/components/bills/BillFilters";
import { listBills, getDashboardStats, type StatusFilter } from "@/lib/bills/queries";
import { getBenchmarkAverages } from "@/lib/market/queries";
import { formatCurrency } from "@/lib/utils";
import { BILL_CATEGORIES, isBenchmarkCategory, type BillCategory } from "@/types";

export const dynamic = "force-dynamic";

function asCategory(v?: string): BillCategory | null {
  return v && (BILL_CATEGORIES as readonly string[]).includes(v)
    ? (v as BillCategory)
    : null;
}
function asStatus(v?: string): StatusFilter {
  return v === "unpaid" || v === "paid" || v === "overdue" ? v : "all";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { category?: string; status?: string; month?: string };
}) {
  const [bills, stats, benchmarkAverages] = await Promise.all([
    listBills({
      category: asCategory(searchParams.category),
      status: asStatus(searchParams.status),
      month: searchParams.month ?? null,
    }),
    getDashboardStats(),
    getBenchmarkAverages(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="In scadenza (30 giorni)"
          value={formatCurrency(stats.dueNext30Total)}
          hint={`${stats.dueNext30Count} scadenze`}
          tone="amber"
        />
        <StatCard
          label="Scadenze da pagare"
          value={String(stats.unpaidCount)}
          hint="totale non pagate"
          tone="red"
        />
        <StatCard
          label="Pagato questo mese"
          value={formatCurrency(stats.paidThisMonthTotal)}
          hint="movimenti saldati"
          tone="emerald"
        />
      </div>

      <BillFilters />

      {/* Bill list */}
      {bills.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-2.5">
          {bills.map((bill) => (
            <li key={bill.id}>
              <BillCard
                bill={bill}
                benchmarkAvg={
                  isBenchmarkCategory(bill.category)
                    ? benchmarkAverages[bill.category]
                    : undefined
                }
              />
            </li>
          ))}
        </ul>
      )}

      {/* Floating action button */}
      <Link
        href="/upload"
        aria-label="Nuova scadenza"
        className="tap-target fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 lg:bottom-8 lg:right-8"
      >
        <Plus size={26} />
      </Link>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "amber" | "red" | "emerald";
}) {
  const tones = {
    amber: "from-amber-50 text-amber-700 ring-amber-100",
    red: "from-red-50 text-red-700 ring-red-100",
    emerald: "from-emerald-50 text-emerald-700 ring-emerald-100",
  } as const;
  return (
    <div
      className={`rounded-xl bg-gradient-to-br to-white p-4 ring-1 ring-inset ${tones[tone]}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
      <Inbox className="text-slate-300" size={48} />
      <h2 className="mt-4 text-lg font-semibold text-slate-800">
        Nessuna scadenza
      </h2>
      <p className="mt-1 max-w-xs text-sm text-slate-500">
        Carica una bolletta e BillTracker estrarrà importo, scadenza e categoria
        per te.
      </p>
      <Link
        href="/upload"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700"
      >
        <Plus size={18} /> Carica una bolletta
      </Link>
    </div>
  );
}
