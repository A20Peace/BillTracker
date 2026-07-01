import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "BillTracker — Non perdere mai più una scadenza",
  description:
    "Carica una bolletta: BillTracker legge importo e scadenza per te, ti avvisa via email e la mette sul calendario. Gratis.",
};

export default async function LandingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Chi è già dentro non ha bisogno della vetrina: dritto all'app.
  if (user) redirect("/home");

  return (
    <div className="min-h-screen overflow-x-clip bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <LandingNav />
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

/* ─── Nav ──────────────────────────────────────────────────────────────────── */

function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🧾</span>
          <span className="text-lg font-bold tracking-tight">
            Bill<span className="text-brand-600 dark:text-brand-400">Tracker</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <a
            href="#funzioni"
            className="tap-target hidden items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 sm:flex"
          >
            Funzioni
          </a>
          <a
            href="#come-funziona"
            className="tap-target hidden items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 sm:flex"
          >
            Come funziona
          </a>
          <Link
            href="/contatti"
            className="tap-target flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
          >
            Contattaci
          </Link>
          <Link
            href="/login"
            className="tap-target flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
          >
            Accedi
          </Link>
          <Link
            href="/register"
            className="tap-target hidden items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 sm:flex"
          >
            Inizia gratis
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* ─── Hero ─────────────────────────────────────────────────────────────────── */

function Hero() {
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
            <Sparkles size={14} /> Con lettura automatica delle bollette
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Le tue bollette,{" "}
            <span className="bg-gradient-to-r from-brand-600 to-sky-500 bg-clip-text text-transparent">
              sotto controllo
            </span>
            .
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            Carica una bolletta e BillTracker legge importo e scadenza per te,
            ti avvisa via email prima che scada e la mette sul calendario.
            Niente more, niente sorprese.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="tap-target inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
            >
              Inizia gratis <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="tap-target inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Accedi
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">
            Gratuito. Nessuna carta di credito richiesta.
          </p>
        </div>

        <HeroMockup />
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      {/* Pannello principale: lista scadenze */}
      <div className="animate-float rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-bold">Prossime scadenze</p>
          <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            Luglio
          </span>
        </div>
        <div className="space-y-3">
          <MockBill emoji="💡" title="Luce" due="15 lug" amount="€ 68,40" tone="amber" chip="In scadenza" />
          <MockBill emoji="🔥" title="Gas" due="22 lug" amount="€ 85,00" tone="slate" chip="Programmata" />
          <MockBill emoji="🌐" title="Internet" due="3 lug" amount="€ 27,90" tone="emerald" chip="Pagata ✓" />
        </div>
      </div>

      {/* Badge fluttuanti attorno al pannello */}
      <div
        className="animate-float absolute -right-3 -top-6 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:-right-8"
        style={{ animationDelay: "-2s", animationDuration: "7s" }}
      >
        📬 Promemoria inviato
      </div>
      <div
        className="animate-float absolute -bottom-6 -left-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:-left-8"
        style={{ animationDelay: "-4s", animationDuration: "8s" }}
      >
        📅 Aggiunto al calendario
      </div>
      <div
        className="animate-float absolute -left-4 top-10 hidden rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium shadow-xl dark:border-slate-800 dark:bg-slate-900 lg:block"
        style={{ animationDelay: "-1s", animationDuration: "6.5s" }}
      >
        ✨ Importo letto: € 68,40
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
        <p className="text-xs text-slate-500 dark:text-slate-400">Scade il {due}</p>
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

const FEATURES = [
  {
    icon: ScanLine,
    title: "Lettura automatica",
    text: "Carica un PDF o una foto: l'intelligenza artificiale estrae importo, scadenza e categoria in pochi secondi.",
  },
  {
    icon: BellRing,
    title: "Promemoria email",
    text: "Un avviso nella tua casella prima di ogni scadenza. Mai più more, solleciti o distacchi.",
  },
  {
    icon: CalendarCheck,
    title: "Google Calendar",
    text: "Ogni scadenza finisce da sola sul tuo calendario, con tanto di notifica sul telefono.",
  },
  {
    icon: Users,
    title: "Conti di famiglia",
    text: "Condividi le bollette con il tuo gruppo familiare: tutti vedono cosa c'è da pagare e chi se ne occupa.",
  },
  {
    icon: BarChart3,
    title: "Analisi delle spese",
    text: "Grafici chiari per capire dove vanno i tuoi soldi, mese per mese e categoria per categoria.",
  },
  {
    icon: TrendingDown,
    title: "Confronto col mercato",
    text: "Scopri se paghi più della media nazionale (dati ARERA e AGCOM) e quando conviene cambiare fornitore.",
  },
] as const;

function Features() {
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
            Tutto quello che serve, in un posto solo
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Dalla foto della bolletta al promemoria: BillTracker si occupa dei
            passaggi noiosi, tu solo di pagare in tempo.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                <Icon size={22} />
              </span>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Come funziona ────────────────────────────────────────────────────────── */

const STEPS = [
  {
    icon: Camera,
    step: "1",
    title: "Carica o fotografa",
    text: "Bolletta cartacea o PDF ricevuto via email: bastano due tocchi per caricarla.",
  },
  {
    icon: Sparkles,
    step: "2",
    title: "L'AI legge per te",
    text: "Importo, scadenza e categoria vengono compilati automaticamente. Tu controlli e confermi.",
  },
  {
    icon: Wallet,
    step: "3",
    title: "Paga in tempo",
    text: "Promemoria via email e sul calendario. Paghi, la segni come pagata, e via alla prossima.",
  },
] as const;

function HowItWorks() {
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
            Come funziona
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Tre passaggi, meno di un minuto.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, step, title, text }) => (
            <div
              key={step}
              className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white shadow-lg shadow-brand-600/30">
                {step}
              </span>
              <span className="mt-2 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                <Icon size={22} />
              </span>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {text}
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
            Pronto a non dimenticare più una scadenza?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
            Crea il tuo account gratuito e carica la prima bolletta: ci pensa
            BillTracker a ricordartela.
          </p>
          <Link
            href="/register"
            className="tap-target mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 font-semibold text-brand-700 shadow-lg transition hover:bg-brand-50"
          >
            Inizia gratis <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="text-lg">🧾</span> BillTracker — gestione scadenze
          bollette
        </p>
        <nav className="flex items-center gap-5 text-sm">
          <Link
            href="/contatti"
            className="font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
          >
            Contattaci
          </Link>
          <Link
            href="/login"
            className="font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
          >
            Accedi
          </Link>
          <Link
            href="/register"
            className="font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
          >
            Registrati
          </Link>
        </nav>
      </div>
    </footer>
  );
}
