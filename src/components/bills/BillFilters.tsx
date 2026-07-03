"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { BILL_CATEGORIES } from "@/types";
import { cn } from "@/lib/utils";
import type { BillCounts } from "@/lib/bills/queries";

// Tab order requested: Da pagare → Tutte → Pagate → Scadute.
const TABS = [
  { value: "unpaid", key: "unpaid" },
  { value: "all", key: "all" },
  { value: "paid", key: "paid" },
  { value: "overdue", key: "overdue" },
] as const;

export function BillFilters({ counts }: { counts: BillCounts }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = useTranslations("bills.filters");
  const tCat = useTranslations("categories");

  // Selects (category/month) replace history; tabs push it (so Back works).
  const setParam = useCallback(
    (key: string, value: string, push = false) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      const url = `${pathname}?${next.toString()}`;
      if (push) router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [params, pathname, router],
  );

  const status = params.get("status") ?? "unpaid";
  const category = params.get("category") ?? "";
  const month = params.get("month") ?? "";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1.5" role="tablist">
        {TABS.map((tab) => {
          const active = status === tab.value;
          const count = counts[tab.key];
          const isOverdueRed = tab.key === "overdue" && count > 0;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setParam("status", tab.value, true)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition",
                active
                  ? "bg-brand-600 text-white"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 ring-1 ring-inset ring-slate-200 dark:ring-slate-800 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800",
              )}
            >
              {t(`tab_${tab.key}`)}
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums",
                  isOverdueRed
                    ? "bg-red-100 text-red-700"
                    : active
                      ? "bg-white/25 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:bg-slate-800 dark:text-slate-400",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <select
          aria-label={t("byCategory")}
          value={category}
          onChange={(e) => setParam("category", e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <option value="">{t("allCategories")}</option>
          {BILL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {tCat(c)}
            </option>
          ))}
        </select>

        <input
          type="month"
          aria-label={t("byMonth")}
          value={month}
          onChange={(e) => setParam("month", e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        />
      </div>
    </div>
  );
}
