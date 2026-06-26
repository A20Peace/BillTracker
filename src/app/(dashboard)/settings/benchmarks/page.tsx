import { redirect } from "next/navigation";
import { BenchmarkAdmin } from "@/components/settings/BenchmarkAdmin";
import { requireUser } from "@/lib/auth";
import type { MarketBenchmark } from "@/types";

export const dynamic = "force-dynamic";

export default async function BenchmarksPage() {
  const { supabase, profile } = await requireUser();

  // Sezione admin: chi non è amministratore viene rimandato in dashboard,
  // senza alcun indizio che questa pagina esista.
  if (!profile?.is_admin) redirect("/dashboard");

  const { data } = await supabase
    .from("market_benchmarks")
    .select("*")
    .order("period", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Benchmark di mercato</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Prezzi medi di riferimento (ARERA per luce/gas, AGCOM per
          telefono/internet). Aggiorna i valori ogni trimestre dalle fonti
          ufficiali — niente migrazioni SQL.
        </p>
      </div>
      <BenchmarkAdmin benchmarks={(data ?? []) as MarketBenchmark[]} />
    </div>
  );
}
