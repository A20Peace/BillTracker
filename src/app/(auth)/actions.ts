"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

/** Schemas are built per-request so zod messages follow the active locale. */
async function schemas() {
  const t = await getTranslations("auth.errors");
  const credentialsSchema = z.object({
    email: z.string().email(t("invalidEmail")),
    password: z.string().min(8, t("passwordMin")),
  });
  const registerSchema = credentialsSchema.extend({
    displayName: z.string().trim().min(1, t("nameRequired")).max(80),
  });
  return { credentialsSchema, registerSchema, t };
}

export type AuthState =
  | {
      error?: string;
      unverified?: boolean;
      email?: string;
      /** Registration succeeded; a confirmation email was sent (no session yet). */
      success?: boolean;
    }
  | null;

function appUrl(): string {
  // Prefer the configured public URL; fall back to the request origin.
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { credentialsSchema, t } = await schemas();
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("invalidData") };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Distinguish "email not yet verified" from genuinely wrong credentials.
    if (
      error.code === "email_not_confirmed" ||
      /email not confirmed|not confirmed/i.test(error.message)
    ) {
      return {
        error: t("unverified"),
        unverified: true,
        email: parsed.data.email,
      };
    }
    return { error: t("wrongCredentials") };
  }

  revalidatePath("/", "layout");
  redirect("/home");
}

/** Resends the sign-up confirmation email. Rate-limited client-side (60s). */
export async function resendConfirmation(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = z.string().email().safeParse(email);
  if (!parsed.success) {
    const t = await getTranslations("auth.errors");
    return { ok: false, error: t("invalidEmail") };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data,
    options: { emailRedirectTo: `${appUrl()}/auth/callback` },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function register(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { registerSchema, t } = await schemas();
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("invalidData") };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${appUrl()}/auth/callback`,
    },
  });
  if (error) {
    return { error: error.message };
  }

  // Supabase does NOT surface duplicate signups (anti-enumeration): an already
  // registered email comes back with an empty `identities` array and no error.
  // Surface it explicitly so the user knows to sign in instead.
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return { error: t("emailExists") };
  }

  // With email confirmation ON there is no session yet: show the "check your
  // inbox" success message instead of redirecting to a protected page (which
  // would just bounce back to /login).
  if (!data.session) {
    return { success: true };
  }

  // Email confirmation disabled → the user is already signed in.
  revalidatePath("/", "layout");
  redirect("/home");
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${appUrl()}/auth/callback?next=/home`,
      // Request the Calendar scope at login so the same consent also enables
      // event creation; `offline`/`consent` make Google return a refresh token.
      scopes:
        "email profile https://www.googleapis.com/auth/calendar.events",
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
  if (error || !data.url) {
    const t = await getTranslations("auth.errors");
    redirect(`/login?error=${encodeURIComponent(t("googleFailed"))}`);
  }
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
