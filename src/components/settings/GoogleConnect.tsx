"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarCheck, Loader2, Link2Off } from "lucide-react";
import { disconnectGoogleAccount, setAutoCalendar } from "@/app/_actions/profile";

const FEEDBACK: Record<string, { tone: "ok" | "err"; key: string }> = {
  connected: { tone: "ok", key: "feedbackConnected" },
  denied: { tone: "err", key: "feedbackDenied" },
  error: { tone: "err", key: "feedbackError" },
};

export function GoogleConnect({
  connected,
  autoCalendar,
}: {
  connected: boolean;
  autoCalendar: boolean;
}) {
  const t = useTranslations("settings.google");
  const params = useSearchParams();
  const feedback = FEEDBACK[params.get("google") ?? ""];
  const [pending, startTransition] = useTransition();
  const [auto, setAuto] = useState(autoCalendar);

  function toggleAuto(next: boolean) {
    setAuto(next);
    startTransition(async () => {
      const res = await setAutoCalendar(next);
      if (!res.ok) setAuto(!next); // revert on failure
    });
  }

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
          {t(feedback.key)}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <CalendarCheck size={20} />
          </span>
          <div className="text-sm">
            <p className="font-medium text-slate-800 dark:text-slate-200">Google Calendar</p>
            <p className={connected ? "text-emerald-600" : "text-slate-500 dark:text-slate-400"}>
              {connected ? t("connected") : t("notConnected")}
            </p>
          </div>
        </div>

        {connected ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => void (await disconnectGoogleAccount()))}
            className="tap-target inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {pending ? <Loader2 size={15} className="animate-spin" /> : <Link2Off size={15} />}
            {t("disconnect")}
          </button>
        ) : (
          <a
            href="/api/google/connect"
            className="tap-target inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {t("connect")}
          </a>
        )}
      </div>

      {connected && (
        <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          <span className="text-sm">
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {t("autoEvents")}
            </span>
            <span className="block text-slate-500 dark:text-slate-400">
              {t("autoEventsHint")}
            </span>
          </span>
          <span className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={auto}
              disabled={pending}
              onChange={(e) => toggleAuto(e.target.checked)}
              className="peer sr-only"
            />
            <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-brand-600 dark:bg-slate-700" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
          </span>
        </label>
      )}

      {!connected && (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {t("connectHint")}
        </p>
      )}
    </div>
  );
}
