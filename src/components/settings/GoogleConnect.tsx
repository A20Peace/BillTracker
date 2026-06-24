"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarCheck, Loader2, Link2Off } from "lucide-react";
import { disconnectGoogleAccount } from "@/app/_actions/profile";

const FEEDBACK: Record<string, { tone: "ok" | "err"; text: string }> = {
  connected: { tone: "ok", text: "Google Calendar collegato con successo." },
  denied: { tone: "err", text: "Accesso a Google negato." },
  error: { tone: "err", text: "Collegamento a Google non riuscito. Riprova." },
};

export function GoogleConnect({ connected }: { connected: boolean }) {
  const params = useSearchParams();
  const feedback = FEEDBACK[params.get("google") ?? ""];
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {feedback && (
        <p
          className={
            "rounded-lg px-3 py-2 text-sm " +
            (feedback.tone === "ok"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700")
          }
        >
          {feedback.text}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <CalendarCheck size={20} />
          </span>
          <div className="text-sm">
            <p className="font-medium text-slate-800">Google Calendar</p>
            <p className={connected ? "text-emerald-600" : "text-slate-500"}>
              {connected ? "Collegato" : "Non collegato"}
            </p>
          </div>
        </div>

        {connected ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => void (await disconnectGoogleAccount()))}
            className="tap-target inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {pending ? <Loader2 size={15} className="animate-spin" /> : <Link2Off size={15} />}
            Scollega
          </button>
        ) : (
          <a
            href="/api/google/connect"
            className="tap-target inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Collega
          </a>
        )}
      </div>

      {!connected && (
        <p className="text-xs text-slate-400">
          Collegando Google Calendar potrai aggiungere automaticamente un
          promemoria per ogni scadenza. Le scadenze si salvano comunque anche
          senza collegamento. Se hai effettuato l&apos;accesso con Google prima
          di questo aggiornamento, esci e rientra con Google (oppure usa il
          pulsante <strong>Collega</strong>) per concedere il permesso al
          calendario.
        </p>
      )}
    </div>
  );
}
