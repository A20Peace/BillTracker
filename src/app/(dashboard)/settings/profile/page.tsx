import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { BarChart3, ChevronRight, Contact, LifeBuoy } from "lucide-react";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { GoogleConnect } from "@/components/settings/GoogleConnect";
import { EmailReminders } from "@/components/settings/EmailReminders";
import { DangerZone } from "@/components/settings/DangerZone";
import { requireUser } from "@/lib/auth";
import { hasGoogleConnected } from "@/lib/google/calendar";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { supabase, user, profile } = await requireUser();
  const [connected, t] = await Promise.all([
    hasGoogleConnected(supabase, user.id),
    getTranslations("settings.page"),
  ]);

  const email = profile?.email ?? user.email ?? "";
  const displayName = profile?.display_name ?? "";
  const emailReminders = profile?.email_reminders ?? true;
  const reminderEmail = profile?.reminder_email ?? "";
  const autoCalendar = profile?.auto_calendar ?? true;
  const canEditBenchmarks = profile?.is_admin === true;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-200">
          {t("yourProfile")}
        </h2>
        <ProfileForm displayName={displayName} email={email} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          {t("integrations")}
        </h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          {t("integrationsHint")}
        </p>

        <div className="space-y-5 divide-y divide-slate-100 dark:divide-slate-800">
          <Suspense fallback={null}>
            <GoogleConnect connected={connected} autoCalendar={autoCalendar} />
          </Suspense>
          <div className="pt-5">
            <EmailReminders
              enabled={emailReminders}
              reminderEmail={reminderEmail}
              loginEmail={email}
            />
          </div>
        </div>
      </section>

      <Link
        href="/contatti"
        className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition hover:bg-slate-50 sm:p-5"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
            <LifeBuoy size={20} />
          </span>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{t("contactTitle")}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("contactHint")}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-400 dark:text-slate-500" />
      </Link>

      {canEditBenchmarks && (
        <>
          <Link
            href="/settings/benchmarks"
            className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition hover:bg-slate-50 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <BarChart3 size={20} />
              </span>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{t("benchmarksTitle")}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("benchmarksHint")}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 dark:text-slate-500" />
          </Link>

          <Link
            href="/settings/contact"
            className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition hover:bg-slate-50 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <Contact size={20} />
              </span>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{t("contactAdminTitle")}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("contactAdminHint")}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 dark:text-slate-500" />
          </Link>
        </>
      )}

      <DangerZone />
    </div>
  );
}
