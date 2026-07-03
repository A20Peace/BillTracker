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
