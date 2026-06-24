import { NextResponse, type NextRequest } from "next/server";
import { processDailyReminders } from "@/lib/resend/notifications";
import { processRecurringBills } from "@/lib/bills/recurrence";

export const runtime = "nodejs";
export const maxDuration = 60;
// Never cache the cron response.
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/reminders
 * Triggered daily by Vercel Cron (see vercel.json). Protected by CRON_SECRET:
 * Vercel sends it as `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET non configurato" }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-cron-secret");
  const authorized = auth === `Bearer ${secret}` || headerSecret === secret;
  if (!authorized) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    // Momento B: ensure next month's records exist for recurring bills due
    // today — BEFORE sending notifications, so the fresh record is included.
    const recurringCreated = await processRecurringBills();
    const result = await processDailyReminders();
    return NextResponse.json({ ok: true, recurringCreated, ...result });
  } catch (err) {
    console.error("[cron/reminders] esecuzione non riuscita:", err);
    return NextResponse.json({ error: "Esecuzione cron non riuscita" }, { status: 500 });
  }
}
