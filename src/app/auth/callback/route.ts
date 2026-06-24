import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveCredentials } from "@/lib/google/calendar";

/**
 * OAuth + email-confirmation callback.
 * Supabase redirects here with a `code` to exchange for a session.
 *
 * When the login was via Google with the Calendar scope, the resulting session
 * carries `provider_token` / `provider_refresh_token`. Supabase does NOT persist
 * those, so we copy them into `google_credentials` here — that lets the robust,
 * auto-refreshing Calendar flow work without a separate "connect" step.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const session = data.session;
      const providerToken = session?.provider_token;
      const scope = (session as { provider_scope?: string } | null)?.provider_scope;
      // Persist Google tokens only when the Calendar scope was granted.
      if (
        providerToken &&
        session?.user &&
        (scope?.includes("calendar.events") ?? true)
      ) {
        try {
          await saveCredentials(supabase, session.user.id, {
            access_token: providerToken,
            refresh_token: session.provider_refresh_token ?? null,
            scope: scope ?? "https://www.googleapis.com/auth/calendar.events",
            token_type: "Bearer",
            // Google access tokens last ~1h; nudge googleapis to refresh.
            expiry_date: Date.now() + 50 * 60 * 1000,
          });
        } catch {
          // Non-fatal: login still succeeds; user can connect Calendar later.
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Autenticazione non riuscita")}`,
  );
}
