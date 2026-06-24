"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { BILL_CATEGORIES } from "@/types";
import { CATEGORY_LABELS } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "all", label: "Tutte" },
  { value: "unpaid", label: "Da pagare" },
  { value: "overdue", label: "Scadute" },
  { value: "paid", label: "Pagate" },
] as const;

export function BillFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const status = params.get("status") ?? "all";
  const category = params.get("category") ?? "";
  const month = params.get("month") ?? "";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => update("status", opt.value === "all" ? "" : opt.value)}
            className={
              "rounded-full px-3 py-1.5 text-sm font-medium transition " +
              (status === opt.value
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50")
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <select
          aria-label="Filtra per categoria"
          value={category}
          onChange={(e) => update("category", e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-500"
        >
          <option value="">Tutte le categorie</option>
          {BILL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>

        <input
          type="month"
          aria-label="Filtra per mese"
          value={month}
          onChange={(e) => update("month", e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-500"
        />
      </div>
    </div>
  );
}
