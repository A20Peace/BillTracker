"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { disconnectGoogle } from "@/lib/google/calendar";

export type ProfileResult = { ok: true } | { ok: false; error: string };

async function requireUserId(): Promise<{ id: string } | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id } : null;
}

/** Updates the display name. */
export async function updateProfile(formData: FormData): Promise<ProfileResult> {
  const parsed = z
    .object({ display_name: z.string().trim().min(1, "Inserisci un nome").max(80) })
    .safeParse({ display_name: formData.get("display_name") });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]!.message };

  const user = await requireUserId();
  if (!user) return { ok: false, error: "Sessione non valida" };

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.display_name })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/profile");
  return { ok: true };
}

/** Email-notification settings: on/off toggle + optional dedicated address. */
export async function updateEmailSettings(formData: FormData): Promise<ProfileResult> {
  const parsed = z
    .object({
      email_reminders: z
        .union([z.literal("on"), z.null()])
        .transform((v) => v === "on"),
      reminder_email: z
        .string()
        .trim()
        .email("Email non valida")
        .or(z.literal(""))
        .transform((v) => (v ? v : null)),
    })
    .safeParse({
      email_reminders: formData.get("email_reminders"),
      reminder_email: formData.get("reminder_email") ?? "",
    });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]!.message };

  const user = await requireUserId();
  if (!user) return { ok: false, error: "Sessione non valida" };

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      email_reminders: parsed.data.email_reminders,
      reminder_email: parsed.data.reminder_email,
    })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/profile");
  return { ok: true };
}

/** Enable/disable automatic Google Calendar event creation. */
export async function setAutoCalendar(enabled: boolean): Promise<ProfileResult> {
  const user = await requireUserId();
  if (!user) return { ok: false, error: "Sessione non valida" };

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ auto_calendar: enabled })
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
