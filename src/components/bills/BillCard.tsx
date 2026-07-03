"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, CalendarCheck, Loader2, Undo2, Users, Repeat } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { setBillPaid } from "@/app/_actions/bills";
import {
  cn,
  formatCurrency,
  formatDate,
  compareToBenchmark,
  billCategoryLabel,
  CATEGORY_EMOJI,
  type BenchmarkLevel,
} from "@/lib/utils";
import type { Bill } from "@/types";

const BADGE_STYLES: Record<BenchmarkLevel, string> = {
  over: "bg-red-50 text-red-700 ring-red-200",
  inline: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-slate-200 dark:ring-slate-800",
  under: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function BillCard({
  bill,
  benchmarkAvg,
}: {
  bill: Bill;
  /** Market average for this bill's category, when available. */
  benchmarkAvg?: number;
}) {
  const locale = useLocale();
  const t = useTranslations("bills");
  const tCat = useTranslations("categories");
  const tBench = useTranslations("benchmark");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isPaid = bill.status === "paid";

  const benchmark =
    benchmarkAvg !== undefined && bill.amount !== null
      ? compareToBenchmark(bill.amount, benchmarkAvg)
      : null;

  function togglePaid() {
    setError(null);
    startTransition(async () => {
      const res = await setBillPaid(bill.id, !isPaid);
      if (!res.ok) setError(res.error);
    });
  }

  const categoryLabel = billCategoryLabel(
    bill.category,
    bill.custom_category,
    tCat(bill.category ?? "none"),
  );

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm transition sm:p-4",
        isPaid && "opacity-70",
      )}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-xl"
        aria-hidden
      >
        {bill.category ? CATEGORY_EMOJI[bill.category] : "📌"}
      </div>

      <Link href={`/bills/${bill.id}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{bill.title}</p>
          {bill.group_id && (
            <Users size={14} className="shrink-0 text-slate-400 dark:text-slate-500" aria-label={t("shared")} />
          )}
        </div>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          {t("categoryDue", {
            category: categoryLabel,
            date: formatDate(bill.due_date, locale),
          })}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={bill.status} dueDate={bill.due_date} />
          {bill.is_recurring && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600">
              <Repeat size={12} />
              {t(`recurrence.${bill.recurrence_unit ?? "month"}`, {
                count: bill.recurrence_interval ?? 1,
              })}
            </span>
          )}
          {benchmark && (
            <span
              title={t("benchmarkHint")}
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                BADGE_STYLES[benchmark.level],
              )}
            >
              {tBench(benchmark.level)}
            </span>
          )}
          {bill.calendar_event_id && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <CalendarCheck size={13} /> Calendar
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-col items-end gap-2">
        <span className="whitespace-nowrap text-base font-bold text-slate-900 dark:text-slate-100 sm:text-lg">
          {formatCurrency(bill.amount, locale)}
        </span>
        <button
          type="button"
          onClick={togglePaid}
          disabled={isPending}
          className={cn(
            "tap-target inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-60",
            isPaid
              ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              : "bg-emerald-600 text-white hover:bg-emerald-700",
          )}
        >
          {isPending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : isPaid ? (
            <Undo2 size={15} />
          ) : (
            <Check size={15} />
          )}
          <span className="hidden sm:inline">
            {isPaid ? t("undoPaid") : t("markPaid")}
          </span>
        </button>
      </div>

      {error && (
        <span className="sr-only" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
