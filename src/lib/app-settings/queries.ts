import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

/** Chiavi di app_settings che compongono la pagina Contattaci. */
export const CONTACT_KEYS = [
  "contact_first_name",
  "contact_last_name",
  "contact_email",
  "contact_phone",
] as const;

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

/**
 * Loads the Contattaci settings, cached and shared across users.
 *
 * Like the market benchmarks, these are global values (same for every visitor,
 * edited rarely by the admin), so we read them with the service-role client —
 * no user data involved — and cache for an hour under the "app-settings" tag.
 * The admin save action calls revalidateTag("app-settings") so edits show up
 * immediately on the public page.
 */
const loadContactSettings = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("app_settings")
      .select("key, value")
      .in("key", [...CONTACT_KEYS]);

    const map: Record<string, string> = {};
    for (const row of data ?? []) map[row.key] = row.value;
    return map;
  },
  ["app-settings-contact"],
  { revalidate: 3600, tags: ["app-settings"] },
);

/** Contact info for the public Contattaci page and the admin form. */
export async function getContactInfo(): Promise<ContactInfo> {
  const map = await loadContactSettings();
  return {
    firstName: map.contact_first_name ?? "",
    lastName: map.contact_last_name ?? "",
    email: map.contact_email ?? "",
    phone: map.contact_phone ?? "",
  };
}
