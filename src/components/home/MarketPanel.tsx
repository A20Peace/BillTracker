import Link from "next/link";
import {
  compareToBenchmark,
  formatCurrency,
  formatBenchmarkPeriod,
  benchmarkSourceName,
  cn,
  CATEGORY_LABELS,
  CATEGORY_EMOJI,
  type BenchmarkLevel,
} from "@/lib/utils";
import { type BenchmarkCategory } from "@/types";
import type { LatestBenchmarks } from "@/lib/market/queries";

// Display order requested for the homepage panel.
const ORDER: BenchmarkCategory[] = ["luce", "gas", "internet", "telefono"];

const LEVEL_STYLES: Record<BenchmarkLevel, string> = {
  over: "bg-red-50 text-red-700 ring-red-200",
  inline: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-slate-200 dark:ring-slate-800",
  under: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const pctFmt = new Intl.NumberFormat("it-IT", {
  style: "percent",
  maximumFractionDigits: 0,
  signDisplay: "always",
});

export function MarketPanel({
  benchmarks,
  userAverages,
}: {
  benchmarks: LatestBenchmarks;
  userAverages: Partial<Record<BenchmarkCategory, number>>;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Prezzi medi di mercato</h2>

      {ORDER.map((cat) => {
        const bench = benchmarks[cat];
        const userAvg = userAverages[cat];
        const cmp =
          bench && userAvg !== undefined
            ? compareToBenchmark(userAvg, bench.avg_monthly_eur)
            : null;

        return (
          <div
            key={cat}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm"
          >
            <p className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
              <span aria-hidden>{CATEGORY_EMOJI[cat]}</span> {CATEGORY_LABELS[cat]}
            </p>

            {bench ? (
              <>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Media mercato:{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(bench.avg_monthly_eur)}/mese
                  </span>
                </p>

                {userAvg !== undefined ? (
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      La tua media:{" "}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(userAvg)}/mese
                      </span>
                    </span>
                    {cmp && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                          LEVEL_STYLES[cmp.level],
                        )}
                      >
                        {cmp.label} {pctFmt.format(cmp.diffPct)}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="mt-1.5 text-sm text-slate-400 dark:text-slate-500">
                    Nessuna spesa registrata
                  </p>
                )}

                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                  Fonte: {benchmarkSourceName(bench.source_url)} ·{" "}
                  {formatBenchmarkPeriod(bench.period)}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                Benchmark non disponibile.
              </p>
            )}
          </div>
        );
      })}

      <Link
        href="/settings/benchmarks"
        className="block text-center text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:underline"
      >
        Aggiorna i prezzi di riferimento
      </Link>
    </div>
  );
}
