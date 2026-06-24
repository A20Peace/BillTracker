import { format, startOfMonth, subMonths } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { BillCategory, MonthlySpending } from "@/types";

export interface SpendingData {
  /** Ascending monthly buckets covering the last 24 months. */
  buckets: MonthlySpending[];
  /** Categories that actually appear in the data. */
  categories: BillCategory[];
}

/**
 * Aggregates spending by month and category from bill due dates.
 * Returns 24 months so the UI can compute year-over-year comparisons.
 */
export async function getSpendingData(): Promise<SpendingData> {
  const supabase = createClient();
  const since = format(startOfMonth(subMonths(new Date(), 23)), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("bills")
    .select("amount, category, due_date")
    .gte("due_date", since)
    .order("due_date", { ascending: true });

  if (error) throw new Error(`Errore analytics: ${error.message}`);

  // Pre-seed 24 contiguous month buckets (so gaps render as zero).
  const buckets = new Map<string, MonthlySpending>();
  for (let i = 23; i >= 0; i--) {
    const key = format(subMonths(new Date(), i), "yyyy-MM");
    buckets.set(key, { month: key, total: 0, byCategory: {} });
  }

  const categoriesSeen = new Set<BillCategory>();

  for (const row of data ?? []) {
    if (row.amount === null) continue;
    const month = (row.due_date as string).slice(0, 7); // YYYY-MM
    const bucket = buckets.get(month);
    if (!bucket) continue;
    const cat = (row.category as BillCategory | null) ?? "altro";
    categoriesSeen.add(cat);
    bucket.total += row.amount;
    bucket.byCategory[cat] = (bucket.byCategory[cat] ?? 0) + row.amount;
  }

  return {
    buckets: Array.from(buckets.values()),
    categories: Array.from(categoriesSeen),
  };
}
