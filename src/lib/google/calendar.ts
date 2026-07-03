import { google } from "googleapis";
import type { Credentials, OAuth2Client } from "google-auth-library";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { formatCurrency, CATEGORY_LABELS } from "@/lib/utils";
import type { Bill, BillCategory } from "@/types";

// Calendar events are generated server-side without a request locale; keep
// the Italian labels used since the first release.
const catLabel = (c: BillCategory | null): string =>
  c ? CATEGORY_LABELS[c] : "Senza categoria";

export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

/** Thrown when the user has not linked Google or the grant was revoked. */
export class GoogleAuthError extends Error {
  constructor(
    public readonly reason: "not_connected" | "reauth_required",
    message: string,
  ) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

function redirectUri(): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  return `${base}/api/webhooks/google`;
}

export function getOAuthClient(): OAuth2Client {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Credenziali Google non configurate");
  return new google.auth.OAuth2(id, secret, redirectUri());
}

/** URL that starts the consent flow. `state` carries the user id. */
export function getConsentUrl(state: string): string {
  return getOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // force a refresh_token on re-link
    scope: [CALENDAR_SCOPE],
    state,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<Credentials> {
  const { tokens } = await getOAuthClient().getToken(code);
  return tokens;
}

type Client = SupabaseClient<Database>;

export async function saveCredentials(
  supabase: Client,
  userId: string,
  tokens: Credentials,
): Promise<void> {
  await supabase.from("google_credentials").upsert(
    {
      user_id: userId,
      access_token: tokens.access_token ?? "",
      // Google only returns refresh_token on first consent; keep the old one otherwise.
      ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
      scope: tokens.scope ?? null,
      token_type: tokens.token_type ?? null,
      expiry_date: tokens.expiry_date ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

export async function hasGoogleConnected(
  supabase: Client,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("google_credentials")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function disconnectGoogle(
  supabase: Client,
  userId: string,
): Promise<void> {
  await supabase.from("google_credentials").delete().eq("user_id", userId);
}

/**
 * Builds an authenticated OAuth client for the user, auto-persisting any
 * refreshed tokens. Throws GoogleAuthError("not_connected") when unlinked.
 */
async function authedClient(
  supabase: Client,
  userId: string,
): Promise<OAuth2Client> {
  const { data } = await supabase
    .from("google_credentials")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    throw new GoogleAuthError("not_connected", "Google Calendar non collegato");
  }

  const client = getOAuthClient();
  client.setCredentials({
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? undefined,
    scope: data.scope ?? undefined,
    token_type: data.token_type ?? undefined,
    expiry_date: data.expiry_date ?? undefined,
  });

  // Persist tokens whenever the library refreshes them.
  client.on("tokens", (tokens) => {
    void saveCredentials(supabase, userId, tokens);
  });

  return client;
}

/**
 * Creates an all-day reminder event for a bill and returns the event id.
 * Throws GoogleAuthError("reauth_required") if the grant was revoked.
 */
export async function createBillEvent(
  supabase: Client,
  userId: string,
  bill: Bill,
): Promise<string> {
  const auth = await authedClient(supabase, userId);
  const calendar = google.calendar({ version: "v3", auth });

  const amountLabel = formatCurrency(bill.amount);
  // All-day events use date-only start/end, end being exclusive (next day).
  const start = bill.due_date;
  const endDate = new Date(`${bill.due_date}T00:00:00`);
  endDate.setDate(endDate.getDate() + 1);
  const end = endDate.toISOString().slice(0, 10);

  try {
    const res = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: `⏰ Scadenza: ${bill.title} — ${amountLabel}`,
        description: `Importo: ${amountLabel}\nCategoria: ${catLabel(
          bill.category,
        )}\nGestito da BillTracker`,
        start: { date: start },
        end: { date: end },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 7 * 24 * 60 }, // 7 days before
            { method: "popup", minutes: 1 * 24 * 60 }, // 1 day before
          ],
        },
      },
    });

    const eventId = res.data.id;
    if (!eventId) throw new Error("Google non ha restituito un id evento");
    return eventId;
  } catch (err: unknown) {
    if (isAuthError(err)) {
      throw new GoogleAuthError(
        "reauth_required",
        "Autorizzazione Google scaduta o revocata",
      );
    }
    throw err;
  }
}

export async function deleteBillEvent(
  supabase: Client,
  userId: string,
  eventId: string,
): Promise<void> {
  try {
    const auth = await authedClient(supabase, userId);
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({ calendarId: "primary", eventId });
  } catch {
    // Event may already be gone or grant revoked — non-fatal.
  }
}

/**
 * Best-effort: create a Calendar event for a freshly saved bill and store its id.
 * Does nothing (silently) when Google isn't connected or the grant was revoked —
 * the bill is saved regardless and the user can still sync manually from the
 * detail page. Works with a user-session client (own creds) or the admin client
 * (cron / recurrence), since both can read the owner's google_credentials.
 */
export async function autoSyncBillToCalendar(
  supabase: Client,
  bill: Bill,
): Promise<void> {
  if (!bill.user_id || bill.calendar_event_id) return;
  try {
    // Respect the user's "auto-create events" preference.
    const { data: profile } = await supabase
      .from("profiles")
      .select("auto_calendar")
      .eq("id", bill.user_id)
      .maybeSingle();
    if (profile && profile.auto_calendar === false) return;

    const eventId = await createBillEvent(supabase, bill.user_id, bill);
    await supabase
      .from("bills")
      .update({ calendar_event_id: eventId })
      .eq("id", bill.id);
  } catch {
    // not connected / reauth required / API error → skip silently
  }
}

function isAuthError(err: unknown): boolean {
  if (err instanceof GoogleAuthError) return err.reason === "reauth_required";
  const code = (err as { code?: number; status?: number })?.code;
  const status = (err as { response?: { status?: number } })?.response?.status;
  return code === 401 || status === 401 || code === 403;
}
