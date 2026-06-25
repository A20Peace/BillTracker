"use client";

import { useState, useTransition } from "react";
import { Loader2, Check, Mail } from "lucide-react";
import { updateEmailSettings } from "@/app/_actions/profile";

export function EmailReminders({
  enabled,
  reminderEmail,
  loginEmail,
}: {
  enabled: boolean;
  reminderEmail: string;
  loginEmail: string;
}) {
  const [on, setOn] = useState(enabled);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function action(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateEmailSettings(formData);
      if (res.ok) setSaved(true);
      else setError(res.error);
    });
  }

  return (
    <form action={action} className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Mail size={20} />
        </span>
        <div className="flex-1">
          <p className="font-medium text-slate-800 dark:text-slate-200">
            Promemoria via email
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Avvisi 14 e 7 giorni prima, ogni giorno dagli ultimi 3 fino alla
            scadenza, poi ogni giorno finché non la paghi.
          </p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            name="email_reminders"
            checked={on}
            onChange={(e) => setOn(e.target.checked)}
            className="peer sr-only"
          />
          <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-brand-600 dark:bg-slate-700 peer-checked:dark:bg-brand-600" />
          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
        </label>
      </div>

      <div>
        <label
          htmlFor="reminder_email"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Email per i promemoria
        </label>
        <input
          id="reminder_email"
          name="reminder_email"
          type="email"
          defaultValue={reminderEmail}
          placeholder={loginEmail}
          className="tap-target mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          disabled={!on}
        />
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Lascia vuoto per usare l&apos;email di accesso ({loginEmail}). Può essere
          un indirizzo secondario o di un familiare.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="tap-target inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending && <Loader2 size={15} className="animate-spin" />}
          Salva
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
            <Check size={15} /> Salvato
          </span>
        )}
      </div>
    </form>
  );
}
