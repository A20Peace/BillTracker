import { getLocale, getTranslations } from "next-intl/server";
import { SpendingChart } from "@/components/analytics/SpendingChart";
import { CategoryBreakdown } from "@/components/analytics/CategoryBreakdown";
import { getSpendingData } from "@/lib/analytics/queries";
import { formatCurrency, intlLocale } from "@/lib/utils";

export const dynamic = "force-dynamic";

function monthName(ym: string, locale: string): string {
  const [y, m] = ym.split("-");
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: "short",
    year: "numeric",
  }).format(new Date(Number(y), Number(m) - 1, 1));
}

export default async function AnalyticsPage() {
  const [{ buckets, categories }, locale, t] = await Promise.all([
    getSpendingData(),
    getLocale(),
    getTranslations("analytics"),
  ]);

  const last12 = buckets.slice(-12);
  const total12 = last12.reduce((acc, b) => acc + b.total, 0);

  // Average over the months that actually have data (not a fixed /12), so a few
  // sparse months don't artificially deflate the figure.
  const withData = last12.filter((b) => b.total > 0);
  const monthsWithData = withData.length;
  const avg = monthsWithData > 0 ? total12 / monthsWithData : 0;
  const rangeLabel =
    monthsWithData > 0
      ? `${monthName(withData[0]!.month, locale)}–${monthName(withData[withData.length - 1]!.month, locale)}`
      : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white dark:bg-slate-900 p-4 ring-1 ring-inset ring-slate-200 dark:ring-slate-800">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {t("last12")}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(total12, locale)}
          </p>
        </div>
        <div className="rounded-xl bg-white dark:bg-slate-900 p-4 ring-1 ring-inset ring-slate-200 dark:ring-slate-800">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {t("monthlyAvg")}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(avg, locale)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {t("monthsRecorded", { count: monthsWithData })}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm sm:p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-200">
          {t("monthlyByCategory")}
        </h2>
        <SpendingChart buckets={buckets} categories={categories} average={avg} />
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          {monthsWithData > 0
            ? t("avgNote", { count: monthsWithData, range: rangeLabel ? ` (${rangeLabel})` : "" })
            : t("noData")}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm sm:p-5">
        <CategoryBreakdown buckets={buckets} categories={categories} />
      </section>
    </div>
  );
}
