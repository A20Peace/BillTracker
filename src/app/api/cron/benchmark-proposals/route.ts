import { NextResponse, type NextRequest } from "next/server";
import { generateBenchmarkProposals } from "@/lib/market/proposals";
import { notifyAdminsOfBenchmarkProposals } from "@/lib/resend/notifications";

export const runtime = "nodejs";
export const maxDuration = 60;
// Never cache the cron response.
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/benchmark-proposals
 * Triggered monthly by Vercel Cron (see vercel.json); idempotent per quarter,
 * so running it more often is harmless. Protected by CRON_SECRET like the
 * reminders cron: Vercel sends it as `Authorization: Bearer <CRON_SECRET>`.
 *
 * Collects the proposed market averages (ARERA extraction for luce/gas,
 * carry-forward for internet/telefono), stores them as pending proposals and
 * emails the administrators. Nothing is published without explicit approval
 * on /settings/benchmarks.
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

  const startedAt = Date.now();
  console.log("[cron/benchmark-proposals] avvio", new Date().toISOString());

  try {
    const result = await generateBenchmarkProposals();
    const email = await notifyAdminsOfBenchmarkProposals(result.created);

    const payload = {
      ok: true,
      period: result.period,
      created: result.created.map((p) => ({
        category: p.category,
        avg_monthly_eur: p.avg_monthly_eur,
        auto_extracted: p.auto_extracted,
      })),
      skippedExisting: result.skippedExisting,
      skippedNoData: result.skippedNoData,
      extractionErrors: result.extractionErrors,
      ...email,
    };
    console.log(
      `[cron/benchmark-proposals] completato in ${Date.now() - startedAt}ms:`,
      JSON.stringify(payload),
    );
    return NextResponse.json(payload);
  } catch (err) {
    console.error("[cron/benchmark-proposals] esecuzione non riuscita:", err);
    return NextResponse.json({ error: "Esecuzione cron non riuscita" }, { status: 500 });
  }
}
