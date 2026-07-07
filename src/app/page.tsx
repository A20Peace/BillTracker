import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  CalendarCheck,
  Camera,
  ScanLine,
  Sparkles,
  TrendingDown,
  Users,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PublicNav } from "@/components/layout/PublicNav";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function LandingPage({
  searchParams,
}: {
  searchParams: { code?: string; error?: string; error_code?: string };
}) {
  // Email-confirmation (and some OAuth) links use the Supabase Site URL as
  // redirect target, so they land here on `/`. Route them to the callback,
  // which exchanges the code / shows the right message.
  if (searchParams.error || searchParams.error_code) {
    redirect("/login?notice=verify_expired");
  }
  if (searchParams.code) {
    redirect(
      `/auth/callback?code=${encodeURIComponent(searchParams.code)}&flow=verify&next=/home`,
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Chi è già dentro non ha bisogno della vetrina: dritto all'app.
  if (user) redirect("/home");

  return (
    <div className="min-h-screen overflow-x-clip bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <PublicNav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}

/* ─── Hero ─────────────────────────────────────────────────────────────────── */

function Hero() {
  const t = useTranslations("landing");

  return (
    <section className="relative overflow-hidden">
      {/* Sfondo in movimento: blob sfumati che derivano lentamente */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="animate-blob absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-300/40 blur-3xl dark:bg-brand-700/25" />
        <div
          className="animate-blob absolute top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-sky-300/40 blur-3xl dark:bg-sky-800/25"
          style={{ animationDelay: "-7s" }}
        />
        <div
          className="animate-blob absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-800/20"
          style={{ animationDelay: "-13s" }}
        />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:pb-28 lg:pt-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
            <Sparkles size={14} /> {t("badge")}
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {t.rich("heroTitle", {
              highlight: (chunks) => (
                <span className="bg-gradient-to-r from-brand-600 to-sky-500 bg-clip-text text-transparent">
                  {chunks}
                </span>
              ),
            })}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            {t("heroText")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="tap-target inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
            >
              {t("ctaStart")} <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="tap-target inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("ctaLogin")}
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">
            {t("ctaNote")}
          </p>
        </div>

        <HeroMockup />
      </div>
    </section>
  );
}

function HeroMockup() {
  const t = useTranslations("landing.mock");
  const tCat = useTranslations("categories");

  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      {/* Pannello principale: lista scadenze */}
      <div className="animate-float rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-bold">{t("title")}</p>
          <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            {t("month")}
          </span>
        </div>
        <div className="space-y-3">
          <MockBill
            emoji="💡"
            title={tCat("luce")}
            due={t("due1")}
            amount="€ 68,40"
            tone="amber"
            chip={t("chipDueSoon")}
          />
          <MockBill
            emoji="🔥"
            title={tCat("gas")}
            due={t("due2")}
            amount="€ 85,00"
            tone="slate"
            chip={t("chipScheduled")}
          />
          <MockBill
            emoji="🌐"
            title={tCat("internet")}
            due={t("due3")}
            amount="€ 27,90"
            tone="emerald"
            chip={t("chipPaid")}
          />
        </div>
      </div>

      {/* Badge fluttuanti attorno al pannello */}
      <div
        className="animate-float absolute -right-3 -top-6 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:-right-8"
        style={{ animationDelay: "-2s", animationDuration: "7s" }}
      >
        📬 {t("badgeReminder")}
      </div>
      <div
        className="animate-float absolute -bottom-6 -left-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:-left-8"
        style={{ animationDelay: "-4s", animationDuration: "8s" }}
      >
        📅 {t("badgeCalendar")}
      </div>
      <div
        className="animate-float absolute -left-4 top-10 hidden rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium shadow-xl dark:border-slate-800 dark:bg-slate-900 lg:block"
        style={{ animationDelay: "-1s", animationDuration: "6.5s" }}
      >
        ✨ {t("badgeParsed")}
      </div>
    </div>
  );
}

function MockBill({
  emoji,
  title,
  due,
  amount,
  chip,
  tone,
}: {
  emoji: string;
  title: string;
  due: string;
  amount: string;
  chip: string;
  tone: "amber" | "emerald" | "slate";
}) {
  const chipClass = {
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  }[tone];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm dark:bg-slate-900">
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{due}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold">{amount}</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${chipClass}`}>
          {chip}
        </span>
      </div>
    </div>
  );
}

/* ─── Funzioni ─────────────────────────────────────────────────────────────── */

const FEATURE_ITEMS = [
  { icon: ScanLine, key: "scan" },
  { icon: BellRing, key: "reminders" },
  { icon: CalendarCheck, key: "calendar" },
  { icon: Users, key: "family" },
  { icon: BarChart3, key: "analytics" },
  { icon: TrendingDown, key: "market" },
] as const;

function Features() {
  const t = useTranslations("landing.features");

  return (
    <section id="funzioni" className="relative overflow-hidden scroll-mt-16">
      {/* Sfondo in movimento sotto le descrizioni */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="animate-blob absolute top-10 left-1/4 h-96 w-96 rounded-full bg-brand-200/50 blur-3xl dark:bg-brand-800/20"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="animate-blob absolute bottom-0 right-10 h-96 w-96 rounded-full bg-sky-200/50 blur-3xl dark:bg-sky-800/20"
          style={{ animationDelay: "-11s" }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("heading")}
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            {t("sub")}
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_ITEMS.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                <Icon size={22} />
              </span>
              <h3 className="mt-4 font-bold">{t(`${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t(`${key}.text`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Come funziona ────────────────────────────────────────────────────────── */

const STEP_ITEMS = [
  { icon: Camera, key: "step1" },
  { icon: Sparkles, key: "step2" },
  { icon: Wallet, key: "step3" },
] as const;

function HowItWorks() {
  const t = useTranslations("landing.how");

  return (
    <section id="come-funziona" className="relative overflow-hidden scroll-mt-16 bg-slate-50 dark:bg-slate-900/40">
      {/* Sfondo in movimento: emoji che fluttuano dietro i passaggi */}
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
        {[
          { e: "🧾", cls: "left-[6%] top-16 text-6xl", delay: "0s", dur: "9s" },
          { e: "💡", cls: "right-[10%] top-10 text-5xl", delay: "-3s", dur: "7s" },
          { e: "🔥", cls: "left-[16%] bottom-12 text-5xl", delay: "-5s", dur: "8s" },
          { e: "💧", cls: "right-[22%] bottom-20 text-4xl", delay: "-2s", dur: "10s" },
          { e: "📶", cls: "left-[45%] top-8 text-4xl", delay: "-6s", dur: "7.5s" },
          { e: "🏠", cls: "right-[40%] bottom-6 text-5xl", delay: "-4s", dur: "9.5s" },
        ].map(({ e, cls, delay, dur }) => (
          <span
            key={cls}
            className={`animate-float absolute opacity-10 dark:opacity-[0.07] ${cls}`}
            style={{ animationDelay: delay, animationDuration: dur }}
          >
            {e}
          </span>
        ))}
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("heading")}
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            {t("sub")}
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEP_ITEMS.map(({ icon: Icon, key }, index) => (
            <div
              key={key}
              className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white shadow-lg shadow-brand-600/30">
                {index + 1}
              </span>
              <span className="mt-2 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                <Icon size={22} />
              </span>
              <h3 className="mt-4 font-bold">{t(`${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t(`${key}.text`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA finale + footer ──────────────────────────────────────────────────── */

function FinalCta() {
  const t = useTranslations("landing.cta");

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-14 text-center text-white shadow-2xl shadow-brand-600/25 sm:px-12">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="animate-blob absolute -top-20 -left-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div
            className="animate-blob absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-white/10 blur-2xl"
            style={{ animationDelay: "-9s" }}
          />
        </div>
        <div className="relative">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
            {t("text")}
          </p>
          <Link
            href="/register"
            className="tap-target mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 font-semibold text-brand-700 shadow-lg transition hover:bg-brand-50"
          >
            {t("button")} <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  const t = useTranslations("landing");
  const tNav = useTranslations("nav");

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="text-lg">🧾</span> {t("footerTagline")}
        </p>
        <nav className="flex items-center gap-5 text-sm">
          <Link
            href="/contatti"
            className="font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
          >
            {tNav("contact")}
          </Link>
          <Link
            href="/login"
            className="font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
          >
            {tNav("login")}
          </Link>
          <Link
            href="/register"
            className="font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
          >
            {tNav("register")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
