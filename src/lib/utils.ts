import { differenceInCalendarDays, parseISO } from "date-fns";
import type { BillCategory, BillStatus } from "@/types";

/** Tiny classnames helper (no clsx dependency needed). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Format a number as EUR. Returns "—" for null/undefined. */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

/** Format an ISO date (YYYY-MM-DD) as e.g. "23 giu 2026". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = iso.length === 10 ? parseISO(iso) : new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Human label per category. */
export const CATEGORY_LABELS: Record<BillCategory, string> = {
  luce: "Luce",
  gas: "Gas",
  acqua: "Acqua",
  condominio: "Condominio",
  telefono: "Telefono",
  internet: "Internet",
  mav: "MAV",
  imu: "IMU",
  assicurazione: "Assicurazione",
  altro: "Altro",
};

/** Emoji per category, used in cards and charts legends. */
export const CATEGORY_EMOJI: Record<BillCategory, string> = {
  luce: "💡",
  gas: "🔥",
  acqua: "💧",
  condominio: "🏢",
  telefono: "📞",
  internet: "🌐",
  mav: "🧾",
  imu: "🏠",
  assicurazione: "🛡️",
  altro: "📌",
};

/** Stable color per category (hex), used by Recharts. */
export const CATEGORY_COLORS: Record<BillCategory, string> = {
  luce: "#f59e0b",
  gas: "#ef4444",
  acqua: "#0ea5e9",
  condominio: "#8b5cf6",
  telefono: "#ec4899",
  internet: "#14b8a6",
  mav: "#64748b",
  imu: "#22c55e",
  assicurazione: "#6366f1",
  altro: "#94a3b8",
};

export const CATEGORY_LABEL = (c: BillCategory | null): string =>
  c ? CATEGORY_LABELS[c] : "Senza categoria";

/**
 * Category label for a specific bill: shows the user's custom text instead of
 * "Altro" when category === "altro" and a custom value is set.
 */
export function billCategoryLabel(
  category: BillCategory | null,
  customCategory?: string | null,
): string {
  if (category === "altro" && customCategory && customCategory.trim()) {
    return customCategory.trim();
  }
  return CATEGORY_LABEL(category);
}

/**
 * Visual status of a bill given its DB status and due date.
 *  - paid    → already paid
 *  - overdue → not paid and due date in the past
 *  - due     → not paid and due within 7 days
 *  - upcoming→ not paid and due further out
 */
export type DisplayStatus = "paid" | "overdue" | "due" | "upcoming";

export function getDisplayStatus(
  status: BillStatus,
  dueDate: string,
  now: Date = new Date(),
): DisplayStatus {
  if (status === "paid") return "paid";
  const days = differenceInCalendarDays(parseISO(dueDate), now);
  if (status === "overdue" || days < 0) return "overdue";
  if (days <= 7) return "due";
  return "upcoming";
}

export function daysUntil(dueDate: string, now: Date = new Date()): number {
  return differenceInCalendarDays(parseISO(dueDate), now);
}

// ─── Market benchmark comparison ──────────────────────────────────────────────

export type BenchmarkLevel = "over" | "inline" | "under";

export interface BenchmarkComparison {
  level: BenchmarkLevel;
  diffPct: number; // signed fraction, e.g. +0.059 = +5.9%
  label: string;
}

/**
 * Compares a monthly spend against a market average.
 *  > +15% → "over" (sopra la media)
 *  within ±15% → "inline"
 *  < -15% → "under" (sotto la media)
 */
export function compareToBenchmark(amount: number, avg: number): BenchmarkComparison {
  const diffPct = avg === 0 ? 0 : (amount - avg) / avg;
  let level: BenchmarkLevel;
  if (diffPct > 0.15) level = "over";
  else if (diffPct < -0.15) level = "under";
  else level = "inline";
  const label =
    level === "over"
      ? "Sopra la media"
      : level === "under"
        ? "Sotto la media"
        : "In linea con il mercato";
  return { level, diffPct, label };
}

/** Compact recurrence label, e.g. "ogni mese", "ogni 2 settimane", "ogni anno". */
export function recurrenceLabel(
  unit: "week" | "month" | "year" | null | undefined,
  interval: number | null | undefined,
): string {
  const u = unit ?? "month";
  const n = interval && interval > 0 ? interval : 1;
  const forms: Record<"week" | "month" | "year", [string, string]> = {
    week: ["settimana", "settimane"],
    month: ["mese", "mesi"],
    year: ["anno", "anni"],
  };
  const [singular, plural] = forms[u];
  return n === 1 ? `ogni ${singular}` : `ogni ${n} ${plural}`;
}

/** "2025-Q1" → "Q1 2025"; falls back to the raw value. */
export function formatBenchmarkPeriod(period: string): string {
  const m = /^(\d{4})-(Q[1-4])$/.exec(period);
  return m ? `${m[2]} ${m[1]}` : period;
}

/** Short source name inferred from the URL (ARERA / AGCOM). */
export function benchmarkSourceName(url: string | null): string {
  if (!url) return "fonte pubblica";
  if (url.includes("arera")) return "ARERA";
  if (url.includes("agcom")) return "AGCOM";
  return "fonte pubblica";
}
