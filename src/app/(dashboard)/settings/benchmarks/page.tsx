import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BenchmarkAdmin } from "@/components/settings/BenchmarkAdmin";
import { ProposalReview } from "@/components/settings/ProposalReview";
import { requireUser } from "@/lib/auth";
import type { BenchmarkProposal, MarketBenchmark } from "@/types";

export const dynamic = "force-dynamic";

export default async function BenchmarksPage() {
  const { supabase, profile } = await requireUser();

  // Sezione admin: chi non è amministratore viene rimandato in dashboard,
  // senza alcun indizio che questa pagina esista.
  if (!profile?.is_admin) redirect("/dashboard");

  // Le proposte si leggono col client RLS dell'utente: la policy della
  // migration 0010 le espone solo agli admin. Finché la migration non è
  // applicata la query fallisce e la sezione resta semplicemente vuota.
  const [{ data }, proposalsRes, t] = await Promise.all([
    supabase
      .from("market_benchmarks")
      .select("*")
      .order("period", { ascending: false }),
    supabase
      .from("benchmark_proposals")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    getTranslations("admin.benchmarks"),
  ]);
  const proposals = (proposalsRes.data ?? []) as BenchmarkProposal[];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t("title")}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("subtitle")}
        </p>
      </div>
      <ProposalReview proposals={proposals} />
      <BenchmarkAdmin benchmarks={(data ?? []) as MarketBenchmark[]} />
    </div>
  );
}
