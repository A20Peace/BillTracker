"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Check,
  Undo2,
  Trash2,
  Pencil,
  FileText,
  CalendarPlus,
  CalendarX,
  Loader2,
  Repeat,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { MarketBenchmark } from "./MarketBenchmark";
import { BillForm, type BillFormValues, type BillFormGroup } from "./BillForm";
import { setBillPaid, deleteBill, updateBill } from "@/app/_actions/bills";
import {
  formatCurrency,
  formatDate,
  billCategoryLabel,
  CATEGORY_EMOJI,
} from "@/lib/utils";
import type { Bill } from "@/types";

export function BillDetail({
  bill,
  documentUrl,
  isPdf,
  groups,
}: {
  bill: Bill;
  documentUrl: string | null;
  isPdf: boolean;
  groups: BillFormGroup[];
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("bills");
  const tDetail = useTranslations("bills.detail");
  const tCat = useTranslations("categories");
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [calBusy, setCalBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPaid = bill.status === "paid";

  function refresh() {
    router.refresh();
  }

  function togglePaid() {
    setError(null);
    startTransition(async () => {
      const res = await setBillPaid(bill.id, !isPaid);
      if (!res.ok) setError(res.error);
      else refresh();
    });
  }

  function remove() {
    if (!confirm(tDetail("confirmDelete"))) return;
    startTransition(async () => {
      const res = await deleteBill(bill.id);
      if (!res.ok) setError(res.error);
      else {
        router.replace("/dashboard");
        router.refresh();
      }
    });
  }

  async function toggleCalendar() {
    setError(null);
    setCalBusy(true);
    try {
      const res = await fetch(`/api/bills/${bill.id}/calendar`, {
        method: bill.calendar_event_id ? "DELETE" : "POST",
      });
      if (res.status === 401) setError(tDetail("calendarNotConnected"));
      else if (res.status === 412) setError(tDetail("calendarExpired"));
      else if (!res.ok) setError(tDetail("calendarFailed"));
      else refresh();
    } catch {
      setError(tDetail("networkError"));
    } finally {
      setCalBusy(false);
    }
  }

  async function saveEdit(values: BillFormValues) {
    const res = await updateBill({
      id: bill.id,
      title: values.title,
      amount: values.amount,
      due_date: values.due_date,
      category: values.category || null,
      custom_category: values.custom_category || null,
      notes: values.notes || null,
      group_id: values.group_id || null,
      is_recurring: values.is_recurring,
      recurrence_unit: values.recurrence_unit,
      recurrence_interval: values.recurrence_interval,
      recurrence_amount_mode: values.recurrence_amount_mode,
    });
    if (!res.ok) return { ok: false, error: res.error };
    setEditing(false);
    refresh();
    return { ok: true };
  }

  if (editing) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-200">
          {tDetail("editTitle")}
        </h2>
        <BillForm
          submitLabel={tDetail("save")}
          groups={groups}
          onSubmit={saveEdit}
          onCancel={() => setEditing(false)}
          defaultValues={{
            title: bill.title,
            amount: bill.amount !== null ? String(bill.amount) : "",
            due_date: bill.due_date,
            category: bill.category ?? "",
            custom_category: bill.custom_category ?? "",
            notes: bill.notes ?? "",
            group_id: bill.group_id ?? "",
            is_recurring: bill.is_recurring,
            recurrence_unit: bill.recurrence_unit ?? "month",
            recurrence_interval: String(bill.recurrence_interval ?? 1),
            recurrence_amount_mode: bill.recurrence_amount_mode ?? "same",
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-2xl">
            {bill.category ? CATEGORY_EMOJI[bill.category] : "📌"}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{bill.title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {billCategoryLabel(
                bill.category,
                bill.custom_category,
                tCat(bill.category ?? "none"),
              )}
            </p>
            {bill.is_recurring && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-100">
                <Repeat size={12} /> {tDetail("recurring")} ·{" "}
                {t(`recurrence.${bill.recurrence_unit ?? "month"}`, {
                  count: bill.recurrence_interval ?? 1,
                })}
              </span>
            )}
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(bill.amount, locale)}
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-400 dark:text-slate-500">{tDetail("dueDate")}</dt>
            <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
              {formatDate(bill.due_date, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400 dark:text-slate-500">{tDetail("status")}</dt>
            <dd className="mt-1">
              <StatusBadge status={bill.status} dueDate={bill.due_date} />
            </dd>
          </div>
          {bill.paid_at && (
            <div>
              <dt className="text-slate-400 dark:text-slate-500">{tDetail("paidOn")}</dt>
              <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
                {formatDate(bill.paid_at, locale)}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-4">
          <MarketBenchmark category={bill.category} amount={bill.amount} />
        </div>

        {bill.notes && (
          <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-sm text-slate-600 dark:text-slate-300">
            {bill.notes}
          </div>
        )}

        {documentUrl && (
          <a
            href={documentUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline"
          >
            <FileText size={16} />
            {isPdf ? tDetail("openPdf") : tDetail("openDocument")}
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={togglePaid}
          disabled={pending}
          className={
            "tap-target inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition disabled:opacity-60 " +
            (isPaid
              ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              : "bg-emerald-600 text-white hover:bg-emerald-700")
          }
        >
          {isPaid ? <Undo2 size={16} /> : <Check size={16} />}
          {isPaid ? tDetail("reopen") : tDetail("paid")}
        </button>

        <button
          type="button"
          onClick={toggleCalendar}
          disabled={calBusy}
          className="tap-target inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 disabled:opacity-60"
        >
          {calBusy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : bill.calendar_event_id ? (
            <CalendarX size={16} />
          ) : (
            <CalendarPlus size={16} />
          )}
          {bill.calendar_event_id ? tDetail("removeCalendar") : "Calendar"}
        </button>

        <button
          type="button"
          onClick={() => setEditing(true)}
          className="tap-target inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50"
        >
          <Pencil size={16} /> {tDetail("edit")}
        </button>

        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="tap-target inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
        >
          <Trash2 size={16} /> {tDetail("delete")}
        </button>
      </div>
    </div>
  );
}
