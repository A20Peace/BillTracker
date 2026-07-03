import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BenchmarkAdmin } from "@/components/settings/BenchmarkAdmin";
import { requireUser } from "@/lib/auth";
import type { MarketBenchmark } from "@/types";

export const dynamic = "force-dynamic";

export default async function BenchmarksPage() {
  const { supabase, profile } = await requireUser();

  // Sezione admin: chi non è amministratore viene rimandato in dashboard,
  // senza alcun indizio che questa pagina esista.
  if (!profile?.is_admin) redirect("/dashboard");

  const [{ data }, t] = await Promise.all([
    supabase
      .from("market_benchmarks")
      .select("*")
      .order("period", { ascending: false }),
    getTranslations("admin.benchmarks"),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t("title")}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("subtitle")}
        </p>
      </div>
      <BenchmarkAdmin benchmarks={(data ?? []) as MarketBenchmark[]} />
    </div>
  );
}
