"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { translateActionError } from "@/lib/i18n";
import { isCurrentUserAdmin } from "@/lib/auth";
import { BENCHMARK_CATEGORIES } from "@/types";

export type BenchmarkResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  category: z.enum(BENCHMARK_CATEGORIES),
  period: z.string().regex(/^\d{4}-Q[1-4]$/, "errInvalidPeriod"),
  avg_monthly_eur: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? Number(v.replace(",", ".")) : v))
    .refine((n) => Number.isFinite(n) && n > 0, "errInvalidAmount"),
  source_url: z
    .string()
    .trim()
    .url("errInvalidUrl")
    .or(z.literal(""))
    .nullable()
    .optional()
    .transform((v) => (v ? v : null)),
  notes: z.string().trim().max(500).nullable().optional().transform((v) => v || null),
});

/**
 * Creates or updates a market benchmark (upsert on category+period).
 * Writes with the service-role client, guarded by an owner check.
 */
export async function upsertBenchmark(
  formData: FormData,
): Promise<BenchmarkResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: await translateActionError("errInvalidSession") };
  if (!(await isCurrentUserAdmin(supabase))) {
    return { ok: false, error: await translateActionError("errNotAuthorized") };
  }

  const parsed = schema.safeParse({
    category: formData.get("category"),
    period: formData.get("period"),
    avg_monthly_eur: formData.get("avg_monthly_eur"),
    source_url: formData.get("source_url"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { ok: false, error: await translateActionError(parsed.error.issues[0]?.message) };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("market_benchmarks").upsert(
    {
      category: parsed.data.category,
      period: parsed.data.period,
      avg_monthly_eur: parsed.data.avg_monthly_eur,
      source_url: parsed.data.source_url ?? null,
      notes: parsed.data.notes ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "category,period" },
  );
  if (error) return { ok: false, error: error.message };

  // Invalida la cache condivisa dei benchmark (vedi lib/market/queries.ts).
  revalidateTag("benchmarks");
  revalidatePath("/settings/benchmarks");
  revalidatePath("/dashboard");
  revalidatePath("/home");
  return { ok: true };
}

// ─── Revisione delle proposte automatiche ────────────────────────────────────

/** Ensures the caller is a signed-in administrator. */
async function requireAdmin(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return await translateActionError("errInvalidSession");
  if (!(await isCurrentUserAdmin(supabase))) {
    return await translateActionError("errNotAuthorized");
  }
  return null;
}

const approveSchema = z.object({
  id: z.string().uuid(),
  avg_monthly_eur: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? Number(v.replace(",", ".")) : v))
    .refine((n) => Number.isFinite(n) && n > 0, "errInvalidAmount"),
});

/**
 * Publishes a pending proposal into market_benchmarks (the admin can adjust
 * the amount before approving) and marks it as approved.
 */
export async function approveBenchmarkProposal(
  formData: FormData,
): Promise<BenchmarkResult> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const parsed = approveSchema.safeParse({
    id: formData.get("id"),
    avg_monthly_eur: formData.get("avg_monthly_eur"),
  });
  if (!parsed.success) {
    return { ok: false, error: await translateActionError(parsed.error.issues[0]?.message) };
  }

  const admin = createAdminClient();
  const { data: proposal } = await admin
    .from("benchmark_proposals")
    .select("*")
    .eq("id", parsed.data.id)
    .eq("status", "pending")
    .maybeSingle();
  if (!proposal) {
    return { ok: false, error: await translateActionError("errProposalNotFound") };
  }

  const { error: upsertError } = await admin.from("market_benchmarks").upsert(
    {
      category: proposal.category,
      period: proposal.period,
      avg_monthly_eur: parsed.data.avg_monthly_eur,
      source_url: proposal.source_url,
      notes: proposal.notes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "category,period" },
  );
  if (upsertError) return { ok: false, error: upsertError.message };

  const { error: updateError } = await admin
    .from("benchmark_proposals")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", proposal.id);
  if (updateError) return { ok: false, error: updateError.message };

  revalidateTag("benchmarks");
  revalidatePath("/settings/benchmarks");
  revalidatePath("/dashboard");
  revalidatePath("/home");
  return { ok: true };
}

/** Discards a pending proposal without touching the published benchmarks. */
export async function rejectBenchmarkProposal(
  proposalId: string,
): Promise<BenchmarkResult> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const id = z.string().uuid().safeParse(proposalId);
  if (!id.success) {
    return { ok: false, error: await translateActionError("errInvalidId") };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("benchmark_proposals")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", id.data)
    .eq("status", "pending");
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/benchmarks");
  return { ok: true };
}
