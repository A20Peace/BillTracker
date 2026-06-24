import Link from "next/link";
import { Suspense } from "react";
import { BarChart3, ChevronRight } from "lucide-react";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { GoogleConnect } from "@/components/settings/GoogleConnect";
import { DangerZone } from "@/components/settings/DangerZone";
import { requireUser } from "@/lib/auth";
import { hasGoogleConnected } from "@/lib/google/calendar";
import { isBenchmarkAdmin } from "@/lib/market/admin";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { supabase, user, profile } = await requireUser();
  const connected = await hasGoogleConnected(supabase, user.id);

  const email = profile?.email ?? user.email ?? "";
  const displayName = profile?.display_name ?? "";
  const emailReminders = profile?.email_reminders ?? true;
  const canEditBenchmarks = isBenchmarkAdmin(user.email);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-800">Il tuo profilo</h2>
        <ProfileForm
          displayName={displayName}
          email={email}
          emailReminders={emailReminders}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-800">Integrazioni</h2>
        <Suspense fallback={null}>
          <GoogleConnect connected={connected} />
        </Suspense>
      </section>

      {canEditBenchmarks && (
        <Link
          href="/settings/benchmarks"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <BarChart3 size={20} />
            </span>
            <div>
              <p className="font-semibold text-slate-800">Benchmark di mercato</p>
              <p className="text-sm text-slate-500">
                Aggiorna i prezzi medi ARERA / AGCOM
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </Link>
      )}

      <DangerZone />
    </div>
  );
}
