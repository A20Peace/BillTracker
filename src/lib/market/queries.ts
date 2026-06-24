import { createClient } from "@/lib/supabase/server";
import {
  type BenchmarkCategory,
  isBenchmarkCategory,
  type MarketBenchmark,
} from "@/types";

export type BenchmarkAverages = Partial<Record<BenchmarkCategory, number>>;

/**
 * Latest market average per benchmark category, as a lookup map.
 * Used by the dashboard to show a compact comparison badge per bill without
 * issuing one request per card.
 */
export async function getBenchmarkAverages(): Promise<BenchmarkAverages> {
  const supabase = createClient();
  const { data } = await supabase
    .from("market_benchmarks")
    .select("category, period, avg_monthly_eur")
    .order("period", { ascending: false });

  const result: BenchmarkAverages = {};
  for (const row of data ?? []) {
    // rows are period-desc, so the first seen per category is the latest.
    if (isBenchmarkCategory(row.category) && result[row.category] === undefined) {
      result[row.category] = row.avg_monthly_eur;
    }
  }
  return result;
}

export type LatestBenchmarks = Partial<Record<BenchmarkCategory, MarketBenchmark>>;

/** Latest full benchmark row per category (with period + source, for the homepage cards). */
export async function getLatestBenchmarks(): Promise<LatestBenchmarks> {
  const supabase = createClient();
  const { data } = await supabase
    .from("market_benchmarks")
    .select("*")
    .order("period", { ascending: false });

  const result: LatestBenchmarks = {};
  for (const row of (data ?? []) as MarketBenchmark[]) {
    if (isBenchmarkCategory(row.category) && result[row.category] === undefined) {
      result[row.category] = row;
    }
  }
  return result;
}
