import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/auth";
import { createBillEvent, deleteBillEvent, GoogleAuthError } from "@/lib/google/calendar";
import type { ApiError, Bill } from "@/types";

export const runtime = "nodejs";

/**
 * POST /api/bills/[id]/calendar
 * Creates a Google Calendar reminder for the bill and stores the event id.
 *  - 401 if not connected (caller should prompt to link Google)
 *  - 412 if the grant was revoked (re-authentication required)
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = z.string().uuid().safeParse(params.id);
  if (!id.success) {
    return NextResponse.json<ApiError>({ error: "ID non valido" }, { status: 400 });
  }

  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json<ApiError>({ error: "Non autenticato" }, { status: 401 });
  }

  const { data: bill, error } = await supabase
    .from("bills")
    .select("*")
    .eq("id", id.data)
    .single();

  if (error || !bill) {
    return NextResponse.json<ApiError>({ error: "Scadenza non trovata" }, { status: 404 });
  }

  // Replace any existing event so we don't create duplicates.
  if (bill.calendar_event_id) {
    await deleteBillEvent(supabase, user.id, bill.calendar_event_id);
  }

  try {
    const eventId = await createBillEvent(supabase, user.id, bill as Bill);
    await supabase
      .from("bills")
      .update({ calendar_event_id: eventId })
      .eq("id", id.data);

    return NextResponse.json({ ok: true, calendar_event_id: eventId });
  } catch (err) {
    if (err instanceof GoogleAuthError) {
      const status = err.reason === "not_connected" ? 401 : 412;
      return NextResponse.json<ApiError>(
        { error: err.message, code: err.reason },
        { status },
      );
    }
    console.error("[bills/calendar] event creation failed");
    return NextResponse.json<ApiError>(
      { error: "Creazione evento non riuscita" },
      { status: 502 },
    );
  }
}

/** DELETE /api/bills/[id]/calendar — remove the linked event. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = z.string().uuid().safeParse(params.id);
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
    .single();

  if (bill?.calendar_event_id) {
    await deleteBillEvent(supabase, user.id, bill.calendar_event_id);
    await supabase.from("bills").update({ calendar_event_id: null }).eq("id", id.data);
  }

  return NextResponse.json({ ok: true });
}
