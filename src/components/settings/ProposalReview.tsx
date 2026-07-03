"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, X, Loader2, ExternalLink, Sparkles, AlertTriangle } from "lucide-react";
import {
  approveBenchmarkProposal,
  rejectBenchmarkProposal,
} from "@/app/_actions/benchmarks";
import { cn, formatBenchmarkPeriod, CATEGORY_EMOJI } from "@/lib/utils";
import type { BenchmarkProposal } from "@/types";

/**
 * Pending benchmark proposals produced by the benchmark-proposals cron.
 * The admin can tweak the amount, then approve (publishes the value) or
 * reject (discards it). Rendered above the manual forms on
 * /settings/benchmarks.
 */
export function ProposalReview({ proposals }: { proposals: BenchmarkProposal[] }) {
  const t = useTranslations("admin.proposals");

  if (proposals.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          {t("title")}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("subtitle")}</p>
      </div>
      <div className="space-y-3">
        {proposals.map((p) => (
          <ProposalCard key={p.id} proposal={p} />
        ))}
      </div>
    </section>
  );
}

function ProposalCard({ proposal }: { proposal: BenchmarkProposal }) {
  const router = useRouter();
  const t = useTranslations("admin.proposals");
  const tCat = useTranslations("categories");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(String(proposal.avg_monthly_eur));

  function approve() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", proposal.id);
      formData.set("avg_monthly_eur", amount);
      const res = await approveBenchmarkProposal(formData);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  function reject() {
    setError(null);
    startTransition(async () => {
      const res = await rejectBenchmarkProposal(proposal.id);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4 shadow-sm dark:border-brand-900/50 dark:bg-brand-900/10 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span aria-hidden className="text-lg">
          {CATEGORY_EMOJI[proposal.category]}
        </span>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
          {tCat(proposal.category)}
        </h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
          {formatBenchmarkPeriod(proposal.period)}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
            proposal.auto_extracted
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-amber-50 text-amber-700 ring-amber-200",
          )}
        >
          {proposal.auto_extracted ? (
            <>
              <Sparkles size={12} /> {t("autoExtracted")}
            </>
          ) : (
            <>
              <AlertTriangle size={12} /> {t("carryForward")}
            </>
          )}
        </span>
      </div>

      {proposal.notes && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{proposal.notes}</p>
      )}

      {proposal.source_url && (
        <a
          href={proposal.source_url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
        >
          {t("openSource")} <ExternalLink size={11} />
        </a>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div>
          <label
            htmlFor={`amount-${proposal.id}`}
            className="block text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            {t("amount")}
          </label>
          <input
            id={`amount-${proposal.id}`}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="tap-target mt-1 w-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
        <button
          type="button"
          onClick={approve}
          disabled={pending}
          className="tap-target inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          {t("approve")}
        </button>
        <button
          type="button"
          onClick={reject}
          disabled={pending}
          className="tap-target inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <X size={15} /> {t("reject")}
        </button>
      </div>
    </div>
  );
}
