"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  formatCurrency,
} from "@/lib/utils";
import type { BillCategory, MonthlySpending } from "@/types";

type Selection = BillCategory | "__total__";

function monthLabel(ym: string, withYear = true): string {
  const [y, m] = ym.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return new Intl.DateTimeFormat("it-IT", {
    month: "short",
    ...(withYear ? { year: "2-digit" } : {}),
  }).format(date);
}

function valueFor(b: MonthlySpending, sel: Selection): number {
  return sel === "__total__" ? b.total : b.byCategory[sel] ?? 0;
}

export function CategoryBreakdown({
  buckets,
  categories,
}: {
  buckets: MonthlySpending[];
  categories: BillCategory[];
}) {
  const [sel, setSel] = useState<Selection>("__total__");

  const last12 = buckets.slice(-12);
  const lineColor = sel === "__total__" ? "#1b5df5" : CATEGORY_COLORS[sel];
  const lineData = last12.map((b) => ({
    label: monthLabel(b.month),
    value: valueFor(b, sel),
  }));

  // Year-over-year: month at index i vs i-12.
  const yoy = buckets
    .map((b, i) => ({ current: b, prev: i >= 12 ? buckets[i - 12] : undefined }))
    .filter((r) => r.prev !== undefined)
    .map((r) => {
      const cur = valueFor(r.current, sel);
      const prev = valueFor(r.prev!, sel);
      const delta = prev === 0 ? null : (cur - prev) / prev;
      return { month: r.current.month, cur, prev, delta };
    });

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-700">Trend mensile</h3>
          <select
            value={sel}
            onChange={(e) => setSel(e.target.value as Selection)}
            aria-label="Seleziona categoria"
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-500"
          >
            <option value="__total__">Tutte le categorie</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" width={56}
                tickFormatter={(v: number) => `€${v}`} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Spesa"]}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">
          Confronto anno su anno
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Mese</th>
                <th className="px-3 py-2 text-right font-medium">Quest&apos;anno</th>
                <th className="px-3 py-2 text-right font-medium">Anno prec.</th>
                <th className="px-3 py-2 text-right font-medium">Variazione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {yoy.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                    Dati insufficienti per il confronto annuale.
                  </td>
                </tr>
              ) : (
                yoy.map((r) => (
                  <tr key={r.month}>
                    <td className="px-3 py-2 font-medium text-slate-700">
                      {monthLabel(r.month)}
                    </td>
                    <td className="px-3 py-2 text-right">{formatCurrency(r.cur)}</td>
                    <td className="px-3 py-2 text-right text-slate-500">
                      {formatCurrency(r.prev)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <DeltaBadge delta={r.delta} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="text-slate-400">—</span>;
  }
  const pct = Math.round(delta * 100);
  if (pct === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-slate-500">
        <Minus size={14} /> 0%
      </span>
    );
  }
  const up = pct > 0;
  return (
    <span
      className={
        "inline-flex items-center gap-1 font-medium " +
        (up ? "text-red-600" : "text-emerald-600")
      }
    >
      {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      {up ? "+" : ""}
      {pct}%
    </span>
  );
}
