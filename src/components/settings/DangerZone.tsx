"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, Loader2 } from "lucide-react";

export function DangerZone() {
  const router = useRouter();
  const t = useTranslations("settings.danger");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    const confirmed = window.confirm(t("confirm"));
    if (!confirmed) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error ?? t("failed"));
        setBusy(false);
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch {
      setError(t("networkError"));
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={20} />
        <div className="flex-1">
          <h2 className="font-semibold text-red-900">{t("title")}</h2>
          <p className="mt-1 text-sm text-red-700/80">
            {t("text")}
          </p>
          {error && <p className="mt-2 text-sm font-medium text-red-700">{error}</p>}
          <button
            type="button"
            onClick={deleteAccount}
            disabled={busy}
            className="tap-target mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {t("button")}
          </button>
        </div>
      </div>
    </div>
  );
}
