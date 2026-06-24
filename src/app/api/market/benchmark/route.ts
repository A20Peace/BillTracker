import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isBenchmarkCategory, type MarketBenchmark } from "@/types";

export const runtime = "nodejs";

/**
 * GET /api/market/benchmark?category=luce
 * Returns the most recent market benchmark for a supported category, or
 * { benchmark: null } for unsupported categories (condominio, mav, …).
 */
export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");
  if (!isBenchmarkCategory(category)) {
    return NextResponse.json({ benchmark: null });
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("market_benchmarks")
    .select("*")
    .eq("category", category)
    .order("period", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ benchmark: (data as MarketBenchmark | null) ?? null });
}
