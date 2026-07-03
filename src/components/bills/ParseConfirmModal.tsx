"use client";

import { useTranslations } from "next-intl";
import { Sparkles, FileText } from "lucide-react";
import { BillForm, type BillFormValues, type BillFormGroup } from "./BillForm";
import { createBill } from "@/app/_actions/bills";
import type { ParsedDocument } from "@/types";

export function ParseConfirmModal({
  parsed,
  documentUrl,
  documentPath,
  isPdf,
  groups,
  onSaved,
  onCancel,
}: {
  parsed: ParsedDocument;
  documentUrl: string;
  documentPath: string;
  isPdf: boolean;
  groups: BillFormGroup[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("upload");
  const confidence =
    typeof parsed.confidence === "number"
      ? Math.round(parsed.confidence * 100)
      : null;

  async function handleSubmit(values: BillFormValues) {
    // createBill auto-adds the Google Calendar reminder when connected.
    const res = await createBill({
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
      document_url: documentPath,
      extracted_raw: parsed,
    });

    if (!res.ok) {
      return { ok: false, error: res.error };
    }

    onSaved();
    return { ok: true };
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl bg-brand-50 p-3 ring-1 ring-inset ring-brand-100">
        <Sparkles className="mt-0.5 shrink-0 text-brand-600" size={18} />
        <div className="text-sm">
          <p className="font-medium text-brand-900">{t("parsedTitle")}</p>
          <p className="text-brand-700/80">
            {t("parsedHint")}
            {confidence !== null && (
              <span className="ml-1 font-medium">
                {t("confidence", { pct: confidence })}
              </span>
            )}
          </p>
        </div>
      </div>

      {documentUrl && (
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
          {isPdf ? (
            <a
              href={documentUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              <FileText size={18} /> {t("openPdf")}
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={documentUrl}
              alt={t("previewAlt")}
              className="max-h-48 w-full object-contain bg-slate-50 dark:bg-slate-800/50"
            />
          )}
        </div>
      )}

      <BillForm
        submitLabel={t("saveBill")}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        groups={groups}
        defaultValues={{
          title: parsed.title ?? "",
          amount: parsed.amount !== null ? String(parsed.amount) : "",
          due_date: parsed.due_date ?? "",
          category: parsed.category ?? "",
        }}
      />
    </div>
  );
}
