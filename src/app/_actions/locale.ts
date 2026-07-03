"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, isLocale } from "@/i18n/config";

/**
 * Persists the user's language choice in the NEXT_LOCALE cookie.
 * Works for both anonymous visitors and logged-in users; the pages
 * re-render in the new language on the next router refresh.
 */
export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  cookies().set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
