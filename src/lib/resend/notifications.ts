import { Resend } from "resend";
import { addDays, format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, CATEGORY_LABEL } from "@/lib/utils";
import type { Bill } from "@/types";

export type ReminderKind = "7days" | "tomorrow" | "overdue";

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
    ${row("Categoria", CATEGORY_LABEL(bill.category))}
  </table>`;
}

function ctaButton(billId: string): string {
  return `<a href="${appUrl()}/bills/${billId}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:15px">Segna come pagata</a>`;
}

function buildReminderEmail(
  kind: ReminderKind,
  bill: Bill,
): { subject: string; html: string } {
  const amount = formatCurrency(bill.amount);
  const map: Record<ReminderKind, { subject: string; heading: string; intro: string }> = {
    "7days": {
      subject: `⏰ Scadenza tra 7 giorni: ${bill.title} — ${amount}`,
      heading: "Scadenza tra 7 giorni",
      intro: `Mancano 7 giorni alla scadenza di <strong>${bill.title}</strong>.`,
    },
    tomorrow: {
      subject: `⏰ Scadenza domani: ${bill.title} — ${amount}`,
      heading: "Scadenza domani",
      intro: `Domani scade <strong>${bill.title}</strong>. Non dimenticare di pagarla.`,
    },
    overdue: {
      subject: `⚠️ Scadenza superata: ${bill.title} — ${amount}`,
      heading: "Scadenza superata",
      intro: `La scadenza di <strong>${bill.title}</strong> è passata. Provvedi al pagamento.`,
    },
  };
  const t = map[kind];
  const body = `<p style="margin:0 0 8px;font-size:15px;line-height:1.6">${t.intro}</p>
    ${billDetailsHtml(bill)}
    <div style="margin-top:8px">${ctaButton(bill.id)}</div>`;
  return { subject: t.subject, html: emailShell(t.heading, body) };
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
    .select("email, display_name, email_reminders")
    .in("id", userIds)
    .eq("email_reminders", true);

  return (profiles ?? [])
    .filter((p): p is { email: string; display_name: string | null; email_reminders: boolean } =>
      Boolean(p.email),
    )
    .map((p) => ({ email: p.email, name: p.display_name }));
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
  sevenDays: number;
  tomorrow: number;
  overdue: number;
  emailsSent: number;
}

/**
 * Daily job: send 7-day and 1-day reminders, mark past-due bills as overdue
 * and notify. Returns counts for observability. Idempotent enough to run once
 * per day (it targets exact due dates).
 */
export async function processDailyReminders(): Promise<ReminderRunResult> {
  const admin = createAdminClient();
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const in7 = format(addDays(today, 7), "yyyy-MM-dd");
  const tomorrow = format(addDays(today, 1), "yyyy-MM-dd");

  const result: ReminderRunResult = { sevenDays: 0, tomorrow: 0, overdue: 0, emailsSent: 0 };

  const dispatch = async (bills: Bill[], kind: ReminderKind) => {
    for (const bill of bills) {
      const recipients = await recipientsForBill(admin, bill);
      const { subject, html } = buildReminderEmail(kind, bill);
      for (const r of recipients) {
        if (await send(r.email, subject, html)) result.emailsSent += 1;
      }
    }
  };

  // 7 days out
  const { data: sevenDayBills } = await admin
    .from("bills")
    .select("*")
    .eq("status", "pending")
    .eq("due_date", in7);
  result.sevenDays = sevenDayBills?.length ?? 0;
  await dispatch((sevenDayBills ?? []) as Bill[], "7days");

  // Tomorrow
  const { data: tomorrowBills } = await admin
    .from("bills")
    .select("*")
    .eq("status", "pending")
    .eq("due_date", tomorrow);
  result.tomorrow = tomorrowBills?.length ?? 0;
  await dispatch((tomorrowBills ?? []) as Bill[], "tomorrow");

  // Past due → flip to overdue and notify
  const { data: overdueBills } = await admin
    .from("bills")
    .select("*")
    .eq("status", "pending")
    .lt("due_date", todayStr);
  result.overdue = overdueBills?.length ?? 0;
  if (overdueBills?.length) {
    await admin
      .from("bills")
      .update({ status: "overdue" })
      .in(
        "id",
        overdueBills.map((b) => b.id),
      );
    await dispatch(overdueBills as Bill[], "overdue");
  }

  return result;
}
