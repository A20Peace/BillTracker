"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { translateActionError } from "@/lib/i18n";
import { isCurrentUserAdmin } from "@/lib/auth";

export type ContactSettingsResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  first_name: z.string().trim().min(1, "errFirstNameRequired").max(100),
  last_name: z.string().trim().min(1, "errLastNameRequired").max(100),
  email: z.string().trim().email("errInvalidEmail").max(200),
  phone: z
    .string()
    .trim()
    .min(1, "errPhoneRequired")
    .max(30)
    .regex(/^[+\d][\d\s().\-/]*$/, "errInvalidPhone"),
});

/**
 * Updates the Contattaci page settings in app_settings.
 *
 * Admin-only. The write goes through the caller's RLS client, so the DB
 * policy ("app settings update by admin") enforces the role a second time
 * even if this guard were bypassed.
 */
export async function updateContactSettings(
  formData: FormData,
): Promise<ContactSettingsResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: await translateActionError("errInvalidSession") };
  if (!(await isCurrentUserAdmin(supabase))) {
    return { ok: false, error: await translateActionError("errNotAuthorized") };
  }

  const parsed = schema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return { ok: false, error: await translateActionError(parsed.error.issues[0]?.message) };
  }

  const { error } = await supabase.from("app_settings").upsert([
    { key: "contact_first_name", value: parsed.data.first_name },
    { key: "contact_last_name", value: parsed.data.last_name },
    { key: "contact_email", value: parsed.data.email },
    { key: "contact_phone", value: parsed.data.phone },
  ]);
  if (error) return { ok: false, error: error.message };

  // Invalida la cache condivisa (vedi lib/app-settings/queries.ts) così la
  // pagina pubblica /contatti riflette subito i nuovi valori.
  revalidateTag("app-settings");
  revalidatePath("/contatti");
  revalidatePath("/settings/contact");
  return { ok: true };
}
