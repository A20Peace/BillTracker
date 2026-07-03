/**
 * Lingue supportate dall'app. L'italiano è la lingua di default e la
 * "sorgente" dei dizionari in src/messages/.
 *
 * La lingua attiva vive nel cookie NEXT_LOCALE (vedi request.ts): niente
 * prefissi /it /en nelle URL, così il cambio lingua funziona da qualsiasi
 * pagina senza toccare il routing esistente.
 */
export const LOCALES = ["it", "en", "es", "fr", "de", "zh"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "it";

export const LOCALE_COOKIE = "NEXT_LOCALE";

/** Nome della lingua nella lingua stessa, per il selettore. */
export const LOCALE_LABELS: Record<Locale, string> = {
  it: "Italiano",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  zh: "中文",
};

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}
