import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Mail, Phone, User } from "lucide-react";
import { getContactInfo } from "@/lib/app-settings/queries";
import { createClient } from "@/lib/supabase/server";
import { PublicNav } from "@/components/layout/PublicNav";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ContattaciPage() {
  const supabase = createClient();
  const [contact, { data: auth }, t] = await Promise.all([
    getContactInfo(),
    supabase.auth.getUser(),
    getTranslations("contact"),
  ]);
  const loggedIn = auth.user !== null;
  const fullName = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50 to-slate-50 dark:from-slate-950 dark:to-slate-900">
      <PublicNav loggedIn={loggedIn} />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 sm:p-8">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("description")}
          </p>

          <ul className="mt-6 space-y-4">
            <li className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <User size={20} />
              </span>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t("referent")}
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
                  {t("email")}
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
                  {t("phone")}
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
      </div>
    </div>
  );
}
