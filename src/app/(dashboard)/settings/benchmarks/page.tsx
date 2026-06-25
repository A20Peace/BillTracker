import { ShieldAlert } from "lucide-react";
import { BenchmarkAdmin } from "@/components/settings/BenchmarkAdmin";
import { requireUser } from "@/lib/auth";
import { isBenchmarkAdmin } from "@/lib/market/admin";
import type { MarketBenchmark } from "@/types";

export const dynamic = "force-dynamic";

export default async function BenchmarksPage() {
  const { supabase, user } = await requireUser();

  if (!isBenchmarkAdmin(user.email)) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <ShieldAlert className="mt-0.5 shrink-0 text-amber-500" size={20} />
          <div>
            <h1 className="font-semibold text-amber-900">Accesso riservato</h1>
            <p className="mt-1 text-sm text-amber-700/80">
              Solo l&apos;amministratore può aggiornare i prezzi medi di mercato.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
