"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { updateProfile } from "@/app/_actions/profile";

export function ProfileForm({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function action(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateProfile(formData);
      if (res.ok) setSaved(true);
      else setError(res.error);
    });
  }

  return (
    <form action={action} className="space-y-4">
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <label
          htmlFor="display_name"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Nome
        </label>
        <input
          id="display_name"
          name="display_name"
          defaultValue={displayName}
          required
          maxLength={80}
          className="tap-target mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Email
        </label>
        <input
          value={email}
          disabled
          className="mt-1 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="tap-target inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending && <Loader2 size={16} className="animate-spin" />}
          Salva nome
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
            <Check size={16} /> Salvato
          </span>
        )}
      </div>
    </form>
  );
}
