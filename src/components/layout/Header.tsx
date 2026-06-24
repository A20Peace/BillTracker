"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";

const TITLES: Array<[string, string]> = [
  ["/home", "Home"],
  ["/dashboard", "Le tue scadenze"],
  ["/analytics", "Analytics"],
  ["/settings/family", "Gruppo familiare"],
  ["/settings/profile", "Profilo"],
  ["/bills", "Dettaglio scadenza"],
];

function titleFor(pathname: string): string {
  const match = TITLES.find(([prefix]) => pathname.startsWith(prefix));
  return match?.[1] ?? "BillTracker";
}

export function Header({
  displayName,
  email,
}: {
  displayName?: string | null;
  email?: string | null;
}) {
  const pathname = usePathname();
  const name = displayName || email || "Utente";
  const initial = name.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
      <h1 className="text-lg font-semibold text-slate-900">{titleFor(pathname)}</h1>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-slate-800">{name}</p>
          {email && <p className="text-xs leading-tight text-slate-400">{email}</p>}
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700"
          aria-hidden
        >
          {initial}
        </div>
        <form action={signOut}>
          <button
            type="submit"
            title="Esci"
            aria-label="Esci"
            className="tap-target flex items-center justify-center rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
