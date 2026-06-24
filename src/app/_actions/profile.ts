"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { disconnectGoogle } from "@/lib/google/calendar";

export type ProfileResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(formData: FormData): Promise<ProfileResult> {
  const parsed = z
    .object({
      display_name: z.string().trim().min(1, "Inserisci un nome").max(80),
      email_reminders: z.union([z.literal("on"), z.null()]).transform((v) => v === "on"),
    })
    .safeParse({
      display_name: formData.get("display_name"),
      email_reminders: formData.get("email_reminders"),
    });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]!.message };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessione non valida" };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.display_name,
      email_reminders: parsed.data.email_reminders,
    })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/profile");
  return { ok: true };
}

export async function disconnectGoogleAccount(): Promise<ProfileResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessione non valida" };

  await disconnectGoogle(supabase, user.id);
  revalidatePath("/settings/profile");
  return { ok: true };
}
