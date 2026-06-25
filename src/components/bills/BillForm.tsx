"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  BILL_CATEGORIES,
  RECURRENCE_UNITS,
  type BillCategory,
  type RecurrenceAmountMode,
  type RecurrenceUnit,
} from "@/types";
import {
  CATEGORY_LABELS,
  formatCurrency,
  formatDate,
  recurrenceLabel,
} from "@/lib/utils";

export interface BillFormValues {
  title: string;
  amount: string; // kept as string in the input, coerced on submit
  due_date: string; // YYYY-MM-DD
  category: BillCategory | "";
  custom_category: string;
  notes: string;
  group_id: string; // "" = personal
  is_recurring: boolean;
  recurrence_unit: RecurrenceUnit;
  recurrence_interval: string; // kept as string for the number input
  recurrence_amount_mode: RecurrenceAmountMode;
}

export interface BillFormGroup {
  id: string;
  name: string;
}

export function BillForm({
  defaultValues,
  groups,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  defaultValues?: Partial<BillFormValues>;
  groups?: BillFormGroup[];
  submitLabel: string;
  onSubmit: (values: BillFormValues) => Promise<{ ok: boolean; error?: string }>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<BillFormValues>({
    title: defaultValues?.title ?? "",
    amount: defaultValues?.amount ?? "",
    due_date: defaultValues?.due_date ?? "",
    category: defaultValues?.category ?? "",
    custom_category: defaultValues?.custom_category ?? "",
    notes: defaultValues?.notes ?? "",
    group_id: defaultValues?.group_id ?? "",
    is_recurring: defaultValues?.is_recurring ?? false,
    recurrence_unit: defaultValues?.recurrence_unit ?? "month",
    recurrence_interval: defaultValues?.recurrence_interval ?? "1",
    recurrence_amount_mode: defaultValues?.recurrence_amount_mode ?? "same",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function set<K extends keyof BillFormValues>(key: K, value: BillFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.title.trim()) return setError("Inserisci un titolo");
    if (!values.due_date) return setError("Inserisci una data di scadenza");
    if (values.category === "altro" && !values.custom_category.trim()) {
      return setError("Specifica la categoria personalizzata");
    }
    setPending(true);
    const res = await onSubmit(values);
    setPending(false);
    if (!res.ok) setError(res.error ?? "Salvataggio non riuscito");
  }

  const field =
    "tap-target mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Titolo
        </label>
        <input
          id="title"
          className={field}
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Es. Bolletta Enel maggio 2025"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Importo (€)
          </label>
          <input
            id="amount"
            className={field}
            inputMode="decimal"
            value={values.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="123.45"
          />
        </div>
        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Scadenza
          </label>
          <input
            id="due_date"
            type="date"
            className={field}
            value={values.due_date}
            onChange={(e) => set("due_date", e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Categoria
        </label>
        <select
          id="category"
          className={field}
          value={values.category}
          onChange={(e) => {
            const next = e.target.value as BillCategory | "";
            // Clear the custom field whenever we move away from "Altro".
            setValues((v) => ({
              ...v,
              category: next,
              custom_category: next === "altro" ? v.custom_category : "",
            }));
          }}
        >
          <option value="">Seleziona…</option>
          {BILL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>

        {values.category === "altro" && (
          <input
            id="custom_category"
            className={field}
            value={values.custom_category}
            onChange={(e) => set("custom_category", e.target.value)}
            placeholder="Categoria personalizzata (es. Abbonamento palestra)"
            required
            maxLength={60}
            aria-label="Categoria personalizzata"
          />
        )}
      </div>

      {groups && groups.length > 0 && (
        <div>
          <label htmlFor="group_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Condividi con
          </label>
          <select
            id="group_id"
            className={field}
            value={values.group_id}
            onChange={(e) => set("group_id", e.target.value)}
          >
            <option value="">Solo io (personale)</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Note
        </label>
        <textarea
          id="notes"
          className={field}
          rows={2}
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={values.is_recurring}
            onChange={(e) => set("is_recurring", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm">
            <span className="font-medium text-slate-800 dark:text-slate-200">Spesa ricorrente</span>
            <span className="block text-slate-500 dark:text-slate-400">
              Crea automaticamente la scadenza successiva con la frequenza scelta.
            </span>
          </span>
        </label>

        {values.is_recurring && (
          <RecurrencePanel
            values={values}
            set={set}
            amountDisplay={
              values.amount
                ? formatCurrency(Number(values.amount.replace(",", ".")))
                : null
            }
          />
        )}
      </div>

      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="tap-target flex-1 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50"
          >
            Annulla
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="tap-target flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending && <Loader2 size={16} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

const UNIT_LABELS: Record<RecurrenceUnit, string> = {
  week: "Settimana/e",
  month: "Mese/i",
  year: "Anno/i",
};

function RecurrencePanel({
  values,
  set,
  amountDisplay,
}: {
  values: BillFormValues;
  set: <K extends keyof BillFormValues>(key: K, value: BillFormValues[K]) => void;
  amountDisplay: string | null;
}) {
  const intervalNum = Math.max(1, parseInt(values.recurrence_interval || "1", 10) || 1);
  const freq = recurrenceLabel(values.recurrence_unit, intervalNum);

  return (
    <div className="mt-3 space-y-3 border-t border-slate-200 dark:border-slate-800 pt-3">
      <div>
        <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">Frequenza</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">ogni</span>
          <input
            type="number"
            min={1}
            max={99}
            value={values.recurrence_interval}
            onChange={(e) => set("recurrence_interval", e.target.value)}
            aria-label="Intervallo"
            className="w-16 rounded-lg border border-slate-300 dark:border-slate-700 px-2 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
          <select
            value={values.recurrence_unit}
            onChange={(e) => set("recurrence_unit", e.target.value as RecurrenceUnit)}
            aria-label="Unità"
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 px-2 py-1.5 text-sm outline-none focus:border-brand-500"
          >
            {RECURRENCE_UNITS.map((u) => (
              <option key={u} value={u}>
                {UNIT_LABELS[u]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
          Importo nelle prossime scadenze
        </p>
        <div className="space-y-1.5">
          <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              name="recurrence_amount_mode"
              checked={values.recurrence_amount_mode === "same"}
              onChange={() => set("recurrence_amount_mode", "same")}
              className="mt-0.5 h-4 w-4 border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
            />
            <span>
              Stesso importo{amountDisplay ? ` (${amountDisplay})` : ""} — modificabile
              all&apos;occorrenza
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              name="recurrence_amount_mode"
              checked={values.recurrence_amount_mode === "empty"}
              onChange={() => set("recurrence_amount_mode", "empty")}
              className="mt-0.5 h-4 w-4 border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
            />
            <span>Lascia importo vuoto — lo inserirò quando arriva la bolletta</span>
          </label>
        </div>
      </div>

      <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
        Verrà creata una nuova scadenza {freq}
        {values.due_date ? ` a partire dal ${formatDate(values.due_date)}` : ""}.
      </p>
    </div>
  );
}
