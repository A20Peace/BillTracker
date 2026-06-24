import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/auth";
import { BILL_CATEGORIES } from "@/types";
import type { ApiError } from "@/types";

export const runtime = "nodejs";

/** GET /api/bills — list the caller's bills (own + shared), due date asc. */
export async function GET() {
  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json<ApiError>({ error: "Non autenticato" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .order("due_date", { ascending: true });

  if (error) {
    return NextResponse.json<ApiError>({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ bills: data });
}

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  amount: z.number().nullable().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.enum(BILL_CATEGORIES).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  group_id: z.string().uuid().nullable().optional(),
  document_url: z.string().nullable().optional(),
});

/** POST /api/bills — create a bill from JSON. */
export async function POST(request: NextRequest) {
  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json<ApiError>({ error: "Non autenticato" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("bills")
    .insert({ ...parsed.data, user_id: user.id, status: "pending" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json<ApiError>({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ bill: data }, { status: 201 });
}
