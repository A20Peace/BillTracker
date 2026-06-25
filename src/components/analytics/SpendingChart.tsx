"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import { CATEGORY_COLORS, CATEGORY_LABELS, formatCurrency } from "@/lib/utils";
import type { BillCategory, MonthlySpending } from "@/types";

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return new Intl.DateTimeFormat("it-IT", { month: "short", year: "2-digit" }).format(date);
}

interface TooltipEntry {
  dataKey?: string | number;
  value?: number;
  color?: string;
}

/** Custom tooltip: lists categories + total, or flags months with no data. */
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload) return null;
  const entries = payload.filter((p) => (p.value ?? 0) > 0);
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-[13px] shadow-sm">
      <p className="mb-1 font-semibold text-slate-800 dark:text-slate-200">{label}</p>
      {entries.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500">Nessuna spesa registrata in questo mese</p>
      ) : (
        <>
          {entries.map((e) => (
            <div key={String(e.dataKey)} className="flex justify-between gap-6">
              <span style={{ color: e.color }}>
                {CATEGORY_LABELS[e.dataKey as BillCategory] ?? String(e.dataKey)}
              </span>
              <span className="font-semibold">{formatCurrency(e.value ?? 0)}</span>
            </div>
          ))}
          <div className="mt-1 flex justify-between gap-6 border-t border-slate-200 dark:border-slate-800 pt-1">
            <span>Totale</span>
            <span className="font-bold">{formatCurrency(total)}</span>
          </div>
        </>
      )}
    </div>
  );
}

/** Stacked bars: monthly spend split by category over the last 12 months. */
export function SpendingChart({
  buckets,
  categories,
  average = 0,
}: {
  buckets: MonthlySpending[];
  categories: BillCategory[];
  /** Average over months-with-data; drawn as a dashed reference line. */
  average?: number;
}) {
  const data = buckets.slice(-12).map((b) => ({
    label: monthLabel(b.month),
    ...b.byCategory,
  }));

  const cats = categories.length ? categories : (["altro"] as BillCategory[]);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" width={56}
            tickFormatter={(v: number) => `€${v}`} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(148,163,184,0.12)" }} />
          <Legend
            formatter={(value: string) => CATEGORY_LABELS[value as BillCategory] ?? value}
            wrapperStyle={{ fontSize: 12 }}
          />
          {average > 0 && (
            <ReferenceLine
              y={average}
              stroke="#1b5df5"
              strokeDasharray="4 4"
              label={{
                value: `media ${formatCurrency(average)}`,
                position: "insideTopRight",
                fill: "#1b5df5",
                fontSize: 11,
              }}
            />
          )}
          {cats.map((cat) => (
            <Bar
              key={cat}
              dataKey={cat}
              stackId="spend"
              fill={CATEGORY_COLORS[cat]}
              radius={[0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
