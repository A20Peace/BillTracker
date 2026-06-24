import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/auth";
import { deleteBillEvent } from "@/lib/google/calendar";
import { BILL_CATEGORIES, BILL_STATUSES } from "@/types";
import type { ApiError } from "@/types";

export const runtime = "nodejs";

const idSchema = z.string().uuid();

/** GET /api/bills/[id] */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = idSchema.safeParse(params.id);
  if (!id.success) {
    return NextResponse.json<ApiError>({ error: "ID non valido" }, { status: 400 });
  }
  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json<ApiError>({ error: "Non autenticato" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("id", id.data)
    .maybeSingle();

  if (error) return NextResponse.json<ApiError>({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json<ApiError>({ error: "Non trovata" }, { status: 404 });
  return NextResponse.json({ bill: data });
}

const patchSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    amount: z.number().nullable(),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    category: z.enum(BILL_CATEGORIES).nullable(),
    status: z.enum(BILL_STATUSES),
    paid_at: z.string().datetime().nullable(),
    notes: z.string().max(2000).nullable(),
    group_id: z.string().uuid().nullable(),
  })
  .partial();

/** PATCH /api/bills/[id] */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = idSchema.safeParse(params.id);
  if (!id.success) {
    return NextResponse.json<ApiError>({ error: "ID non valido" }, { status: 400 });
  }
  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json<ApiError>({ error: "Non autenticato" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("bills")
    .update(parsed.data)
    .eq("id", id.data)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json<ApiError>({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json<ApiError>({ error: "Non trovata" }, { status: 404 });
  return NextResponse.json({ bill: data });
}

/** DELETE /api/bills/[id] — also cleans up the linked calendar event. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = idSchema.safeParse(params.id);
  if (!id.success) {
    return NextResponse.json<ApiError>({ error: "ID non valido" }, { status: 400 });
  }
  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json<ApiError>({ error: "Non autenticato" }, { status: 401 });
  }

  const { data: bill } = await supabase
    .from("bills")
    .select("calendar_event_id")
    .eq("id", id.data)
    .maybeSingle();

  if (bill?.calendar_event_id) {
    await deleteBillEvent(supabase, user.id, bill.calendar_event_id);
  }

  const { error } = await supabase.from("bills").delete().eq("id", id.data);
  if (error) return NextResponse.json<ApiError>({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
