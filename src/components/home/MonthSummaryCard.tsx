import { formatCurrency } from "@/lib/utils";
import type { MonthSummary } from "@/lib/home/queries";

export function MonthSummaryCard({
  summary,
  monthLabel,
}: {
  summary: MonthSummary;
  monthLabel: string;
}) {
  const pct =
    summary.total > 0 ? Math.min(100, Math.round((summary.paid / summary.total) * 100)) : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold capitalize text-slate-800">
        Mese di {monthLabel}
      </h2>

      <dl className="space-y-2 text-sm">
        <Row label="Da pagare questo mese" value={summary.toPay} tone="text-slate-900" />
        <Row label="Già pagato" value={summary.paid} tone="text-emerald-600" />
        <Row label="Scadute non pagate" value={summary.overdue} tone="text-red-600" />
        <div className="!mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
          <dt className="font-semibold text-slate-700">Totale mese</dt>
          <dd className="text-lg font-bold text-slate-900">
            {formatCurrency(summary.total)}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>Pagato</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`font-semibold ${tone}`}>{formatCurrency(value)}</dd>
    </div>
  );
}
