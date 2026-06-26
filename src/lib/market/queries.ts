import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import {
  type BenchmarkCategory,
  isBenchmarkCategory,
  type MarketBenchmark,
} from "@/types";

/**
 * Loads all market benchmarks, cached and shared across users.
 *
 * Benchmarks are global reference data (same for everyone, updated a few times
 * a year), so there's no reason to re-query the DB on every page navigation.
 * We read with the service-role client — these rows contain no user data — and
 * cache the result for an hour, tagged "benchmarks". The benchmark admin action
 * calls revalidateTag("benchmarks") so edits show up immediately.
 */
const loadBenchmarks = unstable_cache(
  async (): Promise<MarketBenchmark[]> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("market_benchmarks")
      .select("*")
      .order("period", { ascending: false });
    return (data ?? []) as MarketBenchmark[];
  },
  ["market-benchmarks"],
  { revalidate: 3600, tags: ["benchmarks"] },
);

export type BenchmarkAverages = Partial<Record<BenchmarkCategory, number>>;

/**
 * Latest market average per benchmark category, as a lookup map.
 * Used by the dashboard to show a compact comparison badge per bill without
 * issuing one request per card.
 */
export async function getBenchmarkAverages(): Promise<BenchmarkAverages> {
  const rows = await loadBenchmarks();

  const result: BenchmarkAverages = {};
  for (const row of rows) {
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
  const rows = await loadBenchmarks();

  const result: LatestBenchmarks = {};
  for (const row of rows) {
    if (isBenchmarkCategory(row.category) && result[row.category] === undefined) {
      result[row.category] = row;
    }
  }
  return result;
}
