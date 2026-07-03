import { getTranslations } from "next-intl/server";

/**
 * Translates server-action error messages in the caller's language.
 *
 * Zod schemas in the _actions files are module-level (their inferred types are
 * exported), so they can't embed request-scoped translations. Instead they use
 * stable "errX" keys as messages; this helper resolves them through the
 * "actionErrors" dictionary at the response boundary. Non-key messages
 * (e.g. raw Supabase errors) pass through unchanged.
 */
export async function translateActionError(message?: string): Promise<string> {
  const t = await getTranslations("actionErrors");
  if (message && /^err[A-Z]/.test(message)) return t(message);
  return message ?? t("errInvalidData");
}
