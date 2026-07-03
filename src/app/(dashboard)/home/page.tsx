import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { UpcomingBills } from "@/components/home/UpcomingBills";
import { MonthSummaryCard } from "@/components/home/MonthSummaryCard";
import { MarketPanel } from "@/components/home/MarketPanel";
import { getUpcomingBills, getCurrentMonthSummary } from "@/lib/home/queries";
import { intlLocale } from "@/lib/utils";
import { getBenchmarkAverages, getLatestBenchmarks } from "@/lib/market/queries";
import { getSpendingData } from "@/lib/analytics/queries";
import { BENCHMARK_CATEGORIES, type BenchmarkCategory } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [upcoming, monthSummary, benchmarkAverages, latestBenchmarks, spending, locale, t] =
    await Promise.all([
      getUpcomingBills(),
      getCurrentMonthSummary(),
      getBenchmarkAverages(),
      getLatestBenchmarks(),
      getSpendingData(),
      getLocale(),
      getTranslations("home"),
    ]);

  // The user's own average per benchmark category over the last 12 months,
  // computed only on months that have data (same logic as analytics).
  const last12 = spending.buckets.slice(-12);
  const userAverages: Partial<Record<BenchmarkCategory, number>> = {};
  for (const cat of BENCHMARK_CATEGORIES) {
    const vals = last12.map((b) => b.byCategory[cat] ?? 0).filter((v) => v > 0);
    if (vals.length > 0) {
      userAverages[cat] = vals.reduce((s, v) => s + v, 0) / vals.length;
    }
  }

  const monthLabel = new Intl.DateTimeFormat(intlLocale(locale), {
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Center column */}
      <div className="min-w-0 flex-1 space-y-8">
        <UpcomingBills bills={upcoming} benchmarkAverages={benchmarkAverages} />
        <MonthSummaryCard summary={monthSummary} monthLabel={monthLabel} />
      </div>

      {/* Right column (sticky on desktop) */}
      <aside className="lg:sticky lg:top-20 lg:w-72 lg:shrink-0">
        <MarketPanel benchmarks={latestBenchmarks} userAverages={userAverages} />
      </aside>

      {/* FAB */}
      <Link
        href="/upload"
        aria-label={t("newBill")}
        className="tap-target fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 lg:bottom-8 lg:right-8"
      >
        <Plus size={26} />
      </Link>
    </div>
  );
}
