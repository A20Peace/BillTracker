"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  compareToBenchmark,
  formatCurrency,
  formatBenchmarkPeriod,
  benchmarkSourceName,
  cn,
  type BenchmarkLevel,
} from "@/lib/utils";
import { isBenchmarkCategory, type MarketBenchmark as Benchmark } from "@/types";

const LEVEL_STYLES: Record<BenchmarkLevel, string> = {
  over: "bg-red-50 text-red-700 ring-red-200",
  inline: "bg-slate-100 text-slate-600 ring-slate-200",
  under: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const pctFmt = new Intl.NumberFormat("it-IT", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "always",
});

/**
 * Shows how a bill's monthly cost compares to the Italian market average
 * (ARERA / AGCOM). Renders nothing for unsupported categories.
 */
export function MarketBenchmark({
  category,
  amount,
}: {
  category: string | null;
  amount: number | null;
}) {
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isBenchmarkCategory(category)) {
      setLoaded(true);
      return;
    }
    let active = true;
    fetch(`/api/market/benchmark?category=${category}`)
      .then((r) => r.json())
      .then((json: { benchmark: Benchmark | null }) => {
        if (active) {
          setBenchmark(json.benchmark);
          setLoaded(true);
        }
      })
      .catch(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [category]);

  if (!loaded || !benchmark) return null;

  const cmp = amount !== null ? compareToBenchmark(amount, benchmark.avg_monthly_eur) : null;
  const Icon =
    cmp?.level === "over" ? TrendingUp : cmp?.level === "under" ? TrendingDown : Minus;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-700">Confronto con il mercato</h3>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">
            Media mercato ({benchmarkSourceName(benchmark.source_url)}{" "}
            {formatBenchmarkPeriod(benchmark.period)})
          </dt>
          <dd className="font-medium text-slate-800">
            {formatCurrency(benchmark.avg_monthly_eur)}/mese
          </dd>
        </div>

        {cmp && (
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">La tua spesa</dt>
            <dd className="flex items-center gap-2 font-medium text-slate-800">
              {formatCurrency(amount)}/mese
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                  LEVEL_STYLES[cmp.level],
                )}
              >
                <Icon size={12} />
                {pctFmt.format(cmp.diffPct)}
              </span>
            </dd>
          </div>
        )}
      </dl>

      {cmp && (
        <p className="mt-3">
          <span
            className={cn(
              "inline-block rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
              LEVEL_STYLES[cmp.level],
            )}
          >
            {cmp.label}
          </span>
        </p>
      )}

      {benchmark.source_url && (
        <a
          href={benchmark.source_url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block text-xs text-slate-400 hover:text-slate-600 hover:underline"
        >
          Fonte: {benchmarkSourceName(benchmark.source_url)} — aggiornato{" "}
          {formatBenchmarkPeriod(benchmark.period)}
        </a>
      )}
    </div>
  );
}
