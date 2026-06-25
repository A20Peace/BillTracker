"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { upsertBenchmark } from "@/app/_actions/benchmarks";
import {
  CATEGORY_LABELS,
  formatCurrency,
  formatBenchmarkPeriod,
} from "@/lib/utils";
import { BENCHMARK_CATEGORIES, type BenchmarkCategory, type MarketBenchmark } from "@/types";

function currentQuarter(): string {
  const now = new Date();
  return `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
}

export function BenchmarkAdmin({ benchmarks }: { benchmarks: MarketBenchmark[] }) {
  // Latest row per category.
  const latest = new Map<BenchmarkCategory, MarketBenchmark>();
  for (const b of benchmarks) {
    const cur = latest.get(b.category);
    if (!cur || b.period > cur.period) latest.set(b.category, b);
  }

  return (
    <div className="space-y-4">
      {BENCHMARK_CATEGORIES.map((category) => (
        <CategoryForm key={category} category={category} current={latest.get(category)} />
      ))}
    </div>
  );
}

function CategoryForm({
  category,
  current,
}: {
  category: BenchmarkCategory;
  current?: MarketBenchmark;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function action(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await upsertBenchmark(formData);
      if (res.ok) setSaved(true);
      else setError(res.error);
    });
  }

  const field =
    "tap-target mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

  return (
    <form
      action={action}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm sm:p-5"
    >
      <input type="hidden" name="category" value={category} />
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">{CATEGORY_LABELS[category]}</h3>
        {current && (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Attuale: {formatCurrency(current.avg_monthly_eur)}/mese ·{" "}
            {formatBenchmarkPeriod(current.period)}
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Periodo</label>
          <input
            name="period"
            required
            defaultValue={current?.period ?? currentQuarter()}
            placeholder="2025-Q1"
            pattern="\d{4}-Q[1-4]"
            className={field}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Media €/mese</label>
          <input
            name="avg_monthly_eur"
            required
            inputMode="decimal"
            defaultValue={current ? String(current.avg_monthly_eur) : ""}
            placeholder="68.00"
            className={field}
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">URL fonte</label>
        <input
          name="source_url"
          type="url"
          defaultValue={current?.source_url ?? ""}
          placeholder="https://www.arera.it"
          className={field}
        />
      </div>

      <div className="mt-3">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Note</label>
        <input
          name="notes"
          defaultValue={current?.notes ?? ""}
          placeholder="Es. Famiglia tipo 2700 kWh/anno"
          className={field}
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="tap-target inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending && <Loader2 size={15} className="animate-spin" />}
          Salva
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
            <Check size={15} /> Aggiornato
          </span>
        )}
      </div>
    </form>
  );
}
