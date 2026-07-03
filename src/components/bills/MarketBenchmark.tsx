"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  compareToBenchmark,
  formatCurrency,
  formatBenchmarkPeriod,
  benchmarkSourceName,
  intlLocale,
  cn,
  type BenchmarkLevel,
} from "@/lib/utils";
import { isBenchmarkCategory, type MarketBenchmark as Benchmark } from "@/types";

const LEVEL_STYLES: Record<BenchmarkLevel, string> = {
  over: "bg-red-50 text-red-700 ring-red-200",
  inline: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-slate-200 dark:ring-slate-800",
  under: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

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
  const locale = useLocale();
  const t = useTranslations("benchmark");
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

  const pctFmt = new Intl.NumberFormat(intlLocale(locale), {
    style: "percent",
    maximumFractionDigits: 1,
    signDisplay: "always",
  });

  const cmp = amount !== null ? compareToBenchmark(amount, benchmark.avg_monthly_eur) : null;
  const Icon =
    cmp?.level === "over" ? TrendingUp : cmp?.level === "under" ? TrendingDown : Minus;
  const source = benchmarkSourceName(benchmark.source_url) ?? t("publicSource");

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("title")}</h3>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-slate-500 dark:text-slate-400">
            {t("marketAvg")} ({source} {formatBenchmarkPeriod(benchmark.period)})
          </dt>
          <dd className="font-medium text-slate-800 dark:text-slate-200">
            {t("perMonth", { amount: formatCurrency(benchmark.avg_monthly_eur, locale) })}
          </dd>
        </div>

        {cmp && (
          <div className="flex items-center justify-between">
            <dt className="text-slate-500 dark:text-slate-400">{t("yourSpend")}</dt>
            <dd className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
              {t("perMonth", { amount: formatCurrency(amount, locale) })}
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
            {t(cmp.level)}
          </span>
        </p>
      )}

      {benchmark.source_url && (
        <a
          href={benchmark.source_url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:underline"
        >
          {t("sourceUpdated", {
            source,
            period: formatBenchmarkPeriod(benchmark.period),
          })}
        </a>
      )}
    </div>
  );
}
