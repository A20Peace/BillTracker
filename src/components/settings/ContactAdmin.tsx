"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Check } from "lucide-react";
import { updateContactSettings } from "@/app/_actions/app-settings";
import type { ContactInfo } from "@/lib/app-settings/queries";

export function ContactAdmin({ contact }: { contact: ContactInfo }) {
  const t = useTranslations("admin.contact");
  const tCommon = useTranslations("common");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function action(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateContactSettings(formData);
      if (res.ok) setSaved(true);
      else setError(res.error);
    });
  }

  const field =
    "tap-target mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

  return (
    <form
      action={action}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm sm:p-5"
    >
      {error && (
        <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">{t("firstName")}</label>
          <input
            name="first_name"
            required
            defaultValue={contact.firstName}
            placeholder="Mario"
            className={field}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">{t("lastName")}</label>
          <input
            name="last_name"
            required
            defaultValue={contact.lastName}
            placeholder="Rossi"
            className={field}
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          {t("contactEmail")}
        </label>
        <input
          name="email"
          type="email"
          required
          defaultValue={contact.email}
          placeholder="contatto@example.com"
          className={field}
        />
      </div>

      <div className="mt-3">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          {t("phoneNumber")}
        </label>
        <input
          name="phone"
          type="tel"
          required
          defaultValue={contact.phone}
          placeholder="+39 333 123 4567"
          className={field}
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="tap-target inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending && <Loader2 size={15} className="animate-spin" />}
          {tCommon("save")}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
            <Check size={15} /> {tCommon("updated")}
          </span>
        )}
      </div>
    </form>
  );
}
