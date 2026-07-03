import { differenceInCalendarDays, parseISO } from "date-fns";
import type { BillCategory, BillStatus } from "@/types";

/** Tiny classnames helper (no clsx dependency needed). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** App locale (cookie value) → BCP 47 tag for Intl formatters. */
const INTL_LOCALES: Record<string, string> = {
  it: "it-IT",
  en: "en-GB",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  zh: "zh-CN",
};

export function intlLocale(locale?: string): string {
  return INTL_LOCALES[locale ?? "it"] ?? "it-IT";
}

/** Format a number as EUR. Returns "—" for null/undefined. */
export function formatCurrency(
  amount: number | null | undefined,
  locale?: string,
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

/** Format an ISO date (YYYY-MM-DD) as e.g. "23 giu 2026". */
export function formatDate(
  iso: string | null | undefined,
  locale?: string,
): string {
  if (!iso) return "—";
  const date = iso.length === 10 ? parseISO(iso) : new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Italian fallback labels per category, used only in non-request contexts
 * (email reminders, calendar events). UI components read the translated
 * labels from the dictionaries via t(`categories.${category}`).
 */
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

/**
 * Resolves the label shown for a bill's category: the user's custom text when
 * category === "altro" and a custom value is set, otherwise the translated
 * label provided by the caller (t(`categories.${category ?? "none"}`)).
 */
export function billCategoryLabel(
  category: BillCategory | null,
  customCategory: string | null | undefined,
  translatedLabel: string,
): string {
  if (category === "altro" && customCategory && customCategory.trim()) {
    return customCategory.trim();
  }
  return translatedLabel;
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
}

/**
 * Compares a monthly spend against a market average.
 *  > +15% → "over" (sopra la media)
 *  within ±15% → "inline"
 *  < -15% → "under" (sotto la media)
 * The human label lives in the dictionaries: t(`benchmark.${level}`).
 */
export function compareToBenchmark(amount: number, avg: number): BenchmarkComparison {
  const diffPct = avg === 0 ? 0 : (amount - avg) / avg;
  let level: BenchmarkLevel;
  if (diffPct > 0.15) level = "over";
  else if (diffPct < -0.15) level = "under";
  else level = "inline";
  return { level, diffPct };
}

/** "2025-Q1" → "Q1 2025"; falls back to the raw value. */
export function formatBenchmarkPeriod(period: string): string {
  const m = /^(\d{4})-(Q[1-4])$/.exec(period);
  return m ? `${m[2]} ${m[1]}` : period;
}

/**
 * Short source name inferred from the URL (ARERA / AGCOM).
 * Returns null for unknown sources; callers show a translated fallback.
 */
export function benchmarkSourceName(url: string | null): string | null {
  if (!url) return null;
  if (url.includes("arera")) return "ARERA";
  if (url.includes("agcom")) return "AGCOM";
  return null;
}
