import { SpendingChart } from "@/components/analytics/SpendingChart";
import { CategoryBreakdown } from "@/components/analytics/CategoryBreakdown";
import { getSpendingData } from "@/lib/analytics/queries";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

function monthName(ym: string): string {
  const [y, m] = ym.split("-");
  return new Intl.DateTimeFormat("it-IT", { month: "short", year: "numeric" }).format(
    new Date(Number(y), Number(m) - 1, 1),
  );
}

export default async function AnalyticsPage() {
  const { buckets, categories } = await getSpendingData();

  const last12 = buckets.slice(-12);
  const total12 = last12.reduce((acc, b) => acc + b.total, 0);

  // Average over the months that actually have data (not a fixed /12), so a few
  // sparse months don't artificially deflate the figure.
  const withData = last12.filter((b) => b.total > 0);
  const monthsWithData = withData.length;
  const avg = monthsWithData > 0 ? total12 / monthsWithData : 0;
  const rangeLabel =
    monthsWithData > 0
      ? `${monthName(withData[0]!.month)}–${monthName(withData[withData.length - 1]!.month)}`
      : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white p-4 ring-1 ring-inset ring-slate-200">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Spesa ultimi 12 mesi
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(total12)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-inset ring-slate-200">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Media mensile
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(avg)}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            su {monthsWithData} {monthsWithData === 1 ? "mese registrato" : "mesi registrati"}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-800">
          Spesa mensile per categoria
        </h2>
        <SpendingChart buckets={buckets} categories={categories} average={avg} />
        <p className="mt-3 text-xs text-slate-500">
          {monthsWithData > 0
            ? `Media calcolata su ${monthsWithData} ${
                monthsWithData === 1 ? "mese" : "mesi"
              } con dati registrati${rangeLabel ? ` (${rangeLabel})` : ""}.`
            : "Nessun dato registrato negli ultimi 12 mesi."}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <CategoryBreakdown buckets={buckets} categories={categories} />
      </section>
    </div>
  );
}
