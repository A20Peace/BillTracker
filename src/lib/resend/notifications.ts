import { Resend } from "resend";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { createAdminClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, billCategoryLabel } from "@/lib/utils";
import type { Bill } from "@/types";

/** Days BEFORE the due date on which a (once-only) reminder is sent. */
const PRE_DUE_DAYS = [14, 7, 3, 2, 1, 0] as const;

interface Recipient {
  email: string;
  name: string | null;
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function fromAddress(): string {
  return process.env.RESEND_FROM ?? "BillTracker <onboarding@resend.dev>";
}

// ─── Email templates ─────────────────────────────────────────────────────────

function emailShell(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="it"><body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">
        <tr><td style="padding:20px 24px;background:#1b5df5;color:#fff;font-size:18px;font-weight:700">🧾 BillTracker</td></tr>
        <tr><td style="padding:24px">
          <h1 style="margin:0 0 12px;font-size:18px">${title}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 24px;background:#f8fafc;color:#94a3b8;font-size:12px;line-height:1.6">
          Ricevi questa email perché hai attivato i promemoria.
          <a href="${appUrl()}/settings/profile" style="color:#64748b">Disattiva le notifiche</a>.
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

function billDetailsHtml(bill: Bill): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 0;color:#64748b;font-size:14px">${label}</td><td style="padding:4px 0;text-align:right;font-weight:600;font-size:14px">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px">
    ${row("Importo", formatCurrency(bill.amount))}
    ${row("Scadenza", formatDate(bill.due_date))}
    ${row("Categoria", billCategoryLabel(bill.category, bill.custom_category))}
  </table>`;
}

function ctaButton(billId: string): string {
  return `<a href="${appUrl()}/bills/${billId}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:15px">Segna come pagata</a>`;
}

/**
 * Builds the reminder email for a bill given how many days remain until the due
 * date (negative = already overdue by that many days).
 */
function reminderContent(
  bill: Bill,
  daysUntil: number,
): { subject: string; html: string } {
  const amount = formatCurrency(bill.amount);
  let heading: string;
  let subject: string;
  let intro: string;

  if (daysUntil > 1) {
    heading = `Scadenza tra ${daysUntil} giorni`;
    subject = `⏰ Scadenza tra ${daysUntil} giorni: ${bill.title} — ${amount}`;
    intro = `Mancano ${daysUntil} giorni alla scadenza di <strong>${bill.title}</strong>.`;
  } else if (daysUntil === 1) {
    heading = "Scadenza domani";
    subject = `⏰ Scadenza domani: ${bill.title} — ${amount}`;
    intro = `Domani scade <strong>${bill.title}</strong>. Non dimenticare di pagarla.`;
  } else if (daysUntil === 0) {
    heading = "Scade oggi";
    subject = `⏰ Scade oggi: ${bill.title} — ${amount}`;
    intro = `Oggi è l'ultimo giorno per pagare <strong>${bill.title}</strong>.`;
  } else {
    const late = -daysUntil;
    heading = `Scaduta da ${late} ${late === 1 ? "giorno" : "giorni"}`;
    subject = `⚠️ Scaduta da ${late} ${late === 1 ? "giorno" : "giorni"}: ${bill.title} — ${amount}`;
    intro = `<strong>${bill.title}</strong> è scaduta da ${late} ${
      late === 1 ? "giorno" : "giorni"
    }. Provvedi al pagamento o segnala come pagata.`;
  }

  const body = `<p style="margin:0 0 8px;font-size:15px;line-height:1.6">${intro}</p>
    ${billDetailsHtml(bill)}
    <div style="margin-top:8px">${ctaButton(bill.id)}</div>`;
  return { subject, html: emailShell(heading, body) };
}

// ─── Sending ─────────────────────────────────────────────────────────────────

async function send(to: string, subject: string, html: string): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn("[resend] RESEND_API_KEY mancante: email non inviata");
    return false;
  }
  const { error } = await resend.emails.send({ from: fromAddress(), to, subject, html });
  if (error) {
    console.error("[resend] invio non riuscito:", error.message);
    return false;
  }
  return true;
}

/** Resolves the recipients (respecting email_reminders) for a bill. */
async function recipientsForBill(
  admin: ReturnType<typeof createAdminClient>,
  bill: Pick<Bill, "id" | "user_id" | "group_id">,
  excludeUserId?: string,
): Promise<Recipient[]> {
  let userIds: string[];

  if (bill.group_id) {
    const { data: members } = await admin
      .from("group_members")
      .select("user_id")
      .eq("group_id", bill.group_id);
    userIds = (members ?? []).map((m) => m.user_id);
  } else {
    userIds = bill.user_id ? [bill.user_id] : [];
  }

  if (excludeUserId) userIds = userIds.filter((id) => id !== excludeUserId);
  if (userIds.length === 0) return [];

  const { data: profiles } = await admin
    .from("profiles")
    .select("email, reminder_email, display_name, email_reminders")
    .in("id", userIds)
    .eq("email_reminders", true);

  // Prefer the dedicated reminder address; fall back to the login email.
  return (profiles ?? [])
    .map((p) => ({
      email: (p.reminder_email?.trim() || p.email) ?? null,
      name: p.display_name,
    }))
    .filter((r): r is Recipient => Boolean(r.email));
}

/**
 * Emails every group member (except the creator) when a shared bill is added.
 * Fire-and-forget: callers ignore failures.
 */
export async function notifyGroupOfNewBill(billId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: bill } = await admin.from("bills").select("*").eq("id", billId).single();
  if (!bill || !bill.group_id) return;

  const recipients = await recipientsForBill(admin, bill, bill.user_id ?? undefined);
  if (recipients.length === 0) return;

  const amount = formatCurrency(bill.amount);
  const subject = `🧾 Nuova scadenza condivisa: ${bill.title} — ${amount}`;
  const body = `<p style="margin:0 0 8px;font-size:15px;line-height:1.6">
      È stata aggiunta una nuova scadenza condivisa con il tuo gruppo.</p>
    ${billDetailsHtml(bill as Bill)}
    <div style="margin-top:8px">${ctaButton(bill.id)}</div>`;
  const html = emailShell("Nuova scadenza condivisa", body);

  await Promise.all(recipients.map((r) => send(r.email, subject, html)));
}

export interface ReminderRunResult {
  candidates: number; // pending/overdue bills examined
  emailsSent: number;
  overdueMarked: number; // bills flipped to "overdue" status
}

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Atomically claims a reminder slot to prevent duplicate sends. Inserts a row
 * into sent_reminders (unique on bill_id + kind); returns true only if this run
 * created it (i.e. it hasn't been sent before).
 */
async function claimReminder(admin: Admin, billId: string, kind: string): Promise<boolean> {
  const { error } = await admin.from("sent_reminders").insert({ bill_id: billId, kind });
  return !error; // unique-violation (already sent) → false
}

/**
 * Daily job (runs ~10:00 IT). Sends scalar reminders:
 *  - once at 14, 7, 3, 2, 1 and 0 days before the due date;
 *  - then every day after the due date until the bill is marked paid.
 * Deduplicated via the sent_reminders table (pre-due once; post-due once/day).
 * Recipients respect each profile's email_reminders flag and reminder_email.
 */
export async function processDailyReminders(): Promise<ReminderRunResult> {
  const admin = createAdminClient();
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const result: ReminderRunResult = { candidates: 0, emailsSent: 0, overdueMarked: 0 };

  // All still-unpaid bills (pending or already overdue).
  const { data: bills } = await admin
    .from("bills")
    .select("*")
    .in("status", ["pending", "overdue"]);

  const overdueIds: string[] = [];

  for (const row of (bills ?? []) as Bill[]) {
    result.candidates += 1;
    const daysUntil = differenceInCalendarDays(parseISO(row.due_date), today);

    // Decide whether a reminder is due and its dedup key.
    let kind: string | null = null;
    if (daysUntil >= 0 && (PRE_DUE_DAYS as readonly number[]).includes(daysUntil)) {
      kind = `d${daysUntil}`; // pre-due, once only
    } else if (daysUntil < 0) {
      kind = `overdue:${todayStr}`; // post-due, once per day
      overdueIds.push(row.id);
    }
    if (!kind) continue;

    // Dedup: skip if this reminder was already sent.
    const claimed = await claimReminder(admin, row.id, kind);
    if (!claimed) continue;

    const recipients = await recipientsForBill(admin, row);
    if (recipients.length === 0) continue;

    const { subject, html } = reminderContent(row, daysUntil);
    for (const r of recipients) {
      if (await send(r.email, subject, html)) result.emailsSent += 1;
    }
  }

  // Keep the status column in sync so the dashboard "Scadute" view is accurate.
  const toMark = overdueIds.filter((id) => {
    const b = (bills ?? []).find((x) => x.id === id);
    return b?.status === "pending";
  });
  if (toMark.length > 0) {
    await admin.from("bills").update({ status: "overdue" }).in("id", toMark);
    result.overdueMarked = toMark.length;
  }

  return result;
}
