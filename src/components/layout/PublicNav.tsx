import Link from "next/link";

/**
 * Top navigation shared by the public pages (landing, login, register,
 * contatti). Always offers a way back to the landing page — no dead ends.
 *
 * With `loggedIn` (e.g. a signed-in user visiting /contatti) the marketing
 * links make no sense, so the right side collapses to a single "Torna
 * all'app" action.
 */
export function PublicNav({ loggedIn = false }: { loggedIn?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={loggedIn ? "/home" : "/"} className="flex items-center gap-2">
          <span className="text-2xl">🧾</span>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Bill<span className="text-brand-600 dark:text-brand-400">Tracker</span>
          </span>
        </Link>

        {loggedIn ? (
          <nav className="flex items-center">
            <Link
              href="/home"
              className="tap-target flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Torna all&apos;app
            </Link>
          </nav>
        ) : (
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className="tap-target flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
            >
              Home
            </Link>
            <Link
              href="/#funzioni"
              className="tap-target hidden items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 md:flex"
            >
              Funzioni
            </Link>
            <Link
              href="/#come-funziona"
              className="tap-target hidden items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 md:flex"
            >
              Come funziona
            </Link>
            <Link
              href="/contatti"
              className="tap-target hidden items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 sm:flex"
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
        )}
      </div>
    </header>
  );
}
