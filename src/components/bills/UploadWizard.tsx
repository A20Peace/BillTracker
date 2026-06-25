"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Camera, Loader2, PencilLine } from "lucide-react";
import { ParseConfirmModal } from "./ParseConfirmModal";
import { BillForm, type BillFormValues, type BillFormGroup } from "./BillForm";
import { createBill } from "@/app/_actions/bills";
import type { ParseResponse, ApiError, ParsedDocument } from "@/types";

type Phase =
  | { kind: "idle" }
  | { kind: "parsing" }
  | { kind: "error"; message: string }
  | { kind: "confirm"; data: ParseResponse; isPdf: boolean }
  | { kind: "manual" };

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

export function UploadWizard({
  groups,
  parsingEnabled = true,
}: {
  groups: BillFormGroup[];
  /** When false (no ANTHROPIC_API_KEY), skip parsing and go straight to manual. */
  parsingEnabled?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>(
    parsingEnabled ? { kind: "idle" } : { kind: "manual" },
  );

  // When parsing is off, cancelling the manual form returns to the dashboard
  // (there is no upload step to fall back to).
  const cancelManual = () =>
    parsingEnabled ? setPhase({ kind: "idle" }) : router.push("/dashboard");

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setPhase({ kind: "error", message: "Il file supera i 10MB." });
      return;
    }
    setPhase({ kind: "parsing" });
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/bills/parse", { method: "POST", body });
      const json = (await res.json()) as ParseResponse | ApiError;
      if (!res.ok || "error" in json) {
        setPhase({
          kind: "error",
          message: "error" in json ? json.error : "Analisi non riuscita.",
        });
        return;
      }
      setPhase({ kind: "confirm", data: json, isPdf: file.type === "application/pdf" });
    } catch {
      setPhase({ kind: "error", message: "Errore di rete durante l'analisi." });
    }
  }

  function onPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (file) void handleFile(file);
  }

  function finish() {
    router.push("/dashboard");
    router.refresh();
  }

  async function saveManual(values: BillFormValues) {
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
    });
    if (!res.ok) return { ok: false, error: res.error };
    finish();
    return { ok: true };
  }

  // ─── Render per phase ──────────────────────────────────────────────────────

  if (phase.kind === "parsing") {
    return <ParsingSkeleton />;
  }

  if (phase.kind === "confirm") {
    return (
      <ParseConfirmModal
        parsed={phase.data.parsed as ParsedDocument}
        documentUrl={phase.data.documentUrl}
        documentPath={phase.data.documentPath}
        isPdf={phase.isPdf}
        groups={groups}
        onSaved={finish}
        onCancel={() => setPhase({ kind: "idle" })}
      />
    );
  }

  if (phase.kind === "manual") {
    return (
      <div>
        {parsingEnabled && (
          <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-200">
            Inserisci manualmente
          </h2>
        )}
        <BillForm
          submitLabel="Salva scadenza"
          groups={groups}
          onSubmit={saveManual}
          onCancel={cancelManual}
        />
      </div>
    );
  }

  // idle / error
  return (
    <div className="space-y-4">
      {phase.kind === "error" && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {phase.message}
        </p>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-10 text-center transition hover:border-brand-400 hover:bg-brand-50/40"
      >
        <UploadCloud className="text-brand-500" size={40} />
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">Carica una bolletta</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">PDF o immagine, fino a 10MB</p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => cameraRef.current?.click()}
        className="tap-target flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 sm:hidden"
      >
        <Camera size={18} /> Scatta una foto
      </button>

      <button
        type="button"
        onClick={() => setPhase({ kind: "manual" })}
        className="tap-target flex w-full items-center justify-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700"
      >
        <PencilLine size={16} /> Inserisci manualmente
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={onPicked}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPicked}
      />
    </div>
  );
}

function ParsingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-2 text-sm font-medium text-brand-700">
        <Loader2 size={16} className="animate-spin" />
        Analisi del documento in corso…
      </div>
      <div className="skeleton h-40 w-full" />
      <div className="space-y-2">
        <div className="skeleton h-10 w-full" />
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
        </div>
        <div className="skeleton h-10 w-full" />
      </div>
    </div>
  );
}
