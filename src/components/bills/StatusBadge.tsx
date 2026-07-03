"use client";

import { useTranslations } from "next-intl";
import { cn, getDisplayStatus, daysUntil, type DisplayStatus } from "@/lib/utils";
import type { BillStatus } from "@/types";

const STYLES: Record<DisplayStatus, { dot: string; chip: string }> = {
  paid: {
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  overdue: {
    dot: "bg-red-500",
    chip: "bg-red-50 text-red-700 ring-red-200",
  },
  due: {
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  upcoming: {
    dot: "bg-slate-400",
    chip: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-slate-200 dark:ring-slate-800",
  },
};

export function StatusBadge({
  status,
  dueDate,
}: {
  status: BillStatus;
  dueDate: string;
}) {
  const t = useTranslations("bills.statusBadge");
  const display = getDisplayStatus(status, dueDate);
  const style = STYLES[display];
  const days = daysUntil(dueDate);

  const label =
    display === "paid"
      ? t("paid")
      : display === "overdue"
        ? t("overdueDays", { days: Math.abs(days) })
        : days === 0
          ? t("dueToday")
          : t("inDays", { days });

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        style.chip,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} aria-hidden />
      {label}
    </span>
  );
}
