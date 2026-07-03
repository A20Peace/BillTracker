import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils";
import type { MonthSummary } from "@/lib/home/queries";

export function MonthSummaryCard({
  summary,
  monthLabel,
}: {
  summary: MonthSummary;
  monthLabel: string;
}) {
  const locale = useLocale();
  const t = useTranslations("home.month");
  const pct =
    summary.total > 0 ? Math.min(100, Math.round((summary.paid / summary.total) * 100)) : 0;

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-200">
        {t("title", { month: monthLabel })}
      </h2>

      <dl className="space-y-2 text-sm">
        <Row label={t("toPay")} value={summary.toPay} tone="text-slate-900 dark:text-slate-100" locale={locale} />
        <Row label={t("alreadyPaid")} value={summary.paid} tone="text-emerald-600" locale={locale} />
        <Row label={t("overdueUnpaid")} value={summary.overdue} tone="text-red-600" locale={locale} />
        <div className="!mt-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
          <dt className="font-semibold text-slate-700 dark:text-slate-300">{t("total")}</dt>
          <dd className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(summary.total, locale)}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{t("paid")}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  tone,
  locale,
}: {
  label: string;
  value: number;
  tone: string;
  locale: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={`font-semibold ${tone}`}>{formatCurrency(value, locale)}</dd>
    </div>
  );
}
