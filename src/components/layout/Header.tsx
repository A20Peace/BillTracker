"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

/** Route prefix → translation key inside the "titles" namespace. */
const TITLE_KEYS: Array<[string, string]> = [
  ["/home", "home"],
  ["/dashboard", "dashboard"],
  ["/analytics", "analytics"],
  ["/settings/family", "family"],
  ["/settings/profile", "profile"],
  ["/bills", "billDetail"],
];

export function Header({
  displayName,
  email,
}: {
  displayName?: string | null;
  email?: string | null;
}) {
  const pathname = usePathname();
  const t = useTranslations("titles");
  const tCommon = useTranslations("common");
  const name = displayName || email || tCommon("user");
  const initial = name.charAt(0).toUpperCase();

  const titleKey = TITLE_KEYS.find(([prefix]) => pathname.startsWith(prefix))?.[1];
  const title = titleKey ? t(titleKey) : "BillTracker";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h1>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-slate-800 dark:text-slate-200">
            {name}
          </p>
          {email && (
            <p className="text-xs leading-tight text-slate-400 dark:text-slate-500">{email}</p>
          )}
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
          aria-hidden
        >
          {initial}
        </div>
        <LanguageSwitcher />
        <ThemeToggle />
        <form action={signOut}>
          <button
            type="submit"
            title={tCommon("logout")}
            aria-label={tCommon("logout")}
            className="tap-target flex items-center justify-center rounded-lg p-2 text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
