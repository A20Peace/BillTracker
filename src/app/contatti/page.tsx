import Link from "next/link";
import type { Metadata } from "next";
import { Mail, Phone, User } from "lucide-react";
import { getContactInfo } from "@/lib/app-settings/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contattaci — BillTracker",
  description: "I riferimenti per contattare il gestore di BillTracker.",
};

export default async function ContattaciPage() {
  const contact = await getContactInfo();
  const fullName = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 dark:from-slate-950 dark:to-slate-900 px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="text-3xl">🧾</span>
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Bill<span className="text-brand-600">Tracker</span>
        </span>
      </Link>

      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 sm:p-8">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Contattaci
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Per domande, segnalazioni o suggerimenti su BillTracker, questi sono
          i riferimenti del gestore dell&apos;app.
        </p>

        <ul className="mt-6 space-y-4">
          <li className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <User size={20} />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Referente
              </p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {fullName || "—"}
              </p>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <Mail size={20} />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Email
              </p>
              {contact.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  className="font-semibold text-brand-600 hover:underline"
                >
                  {contact.email}
                </a>
              ) : (
                <p className="font-semibold text-slate-800 dark:text-slate-200">—</p>
              )}
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <Phone size={20} />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Telefono
              </p>
              {contact.phone ? (
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                  className="font-semibold text-brand-600 hover:underline"
                >
                  {contact.phone}
                </a>
              ) : (
                <p className="font-semibold text-slate-800 dark:text-slate-200">—</p>
              )}
            </div>
          </li>
        </ul>
      </div>

      <p className="mt-6 max-w-md text-center text-xs text-slate-400 dark:text-slate-500">
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Torna all&apos;accesso
        </Link>
      </p>
    </div>
  );
}
