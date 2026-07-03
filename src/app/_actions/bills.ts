"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { translateActionError } from "@/lib/i18n";
import { ensureNextRecurrence } from "@/lib/bills/recurrence";
import {
  BILL_CATEGORIES,
  RECURRENCE_AMOUNT_MODES,
  RECURRENCE_UNITS,
  type Bill,
  type RecurrenceAmountMode,
  type RecurrenceUnit,
} from "@/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

const idSchema = z.string().uuid();

/** Recurrence columns derived from the form values (nulled when not recurring). */
function recurrenceColumns(
  isRecurring: boolean,
  unit: RecurrenceUnit | null | undefined,
  interval: number | null | undefined,
  mode: RecurrenceAmountMode | null | undefined,
): {
  recurrence_unit: RecurrenceUnit | null;
  recurrence_interval: number | null;
  recurrence_amount_mode: RecurrenceAmountMode | null;
} {
  if (!isRecurring) {
    return {
      recurrence_unit: null,
      recurrence_interval: null,
      recurrence_amount_mode: null,
    };
  }
  return {
    recurrence_unit: unit ?? "month",
    recurrence_interval: interval ?? 1,
    recurrence_amount_mode: mode ?? "same",
  };
}

/** Toggle a bill to paid (sets paid_at) or back to pending. */
export async function setBillPaid(
  billId: string,
  paid: boolean,
): Promise<ActionResult> {
  const id = idSchema.safeParse(billId);
  if (!id.success) return { ok: false, error: await translateActionError("errInvalidId") };

  const supabase = createClient();
  const { data: bill, error } = await supabase
    .from("bills")
    .update({
      status: paid ? "paid" : "pending",
      paid_at: paid ? new Date().toISOString() : null,
    })
    .eq("id", id.data)
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };

  // Momento A: paying a recurring bill spawns next month's occurrence
  // (deduplicated). Never let this block the "mark as paid" action.
  if (paid && bill?.is_recurring) {
    try {
      await ensureNextRecurrence(supabase, bill as Bill);
    } catch {
      /* non-fatal */
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  return { ok: true };
}

export async function deleteBill(billId: string): Promise<ActionResult> {
  const id = idSchema.safeParse(billId);
  if (!id.success) return { ok: false, error: await translateActionError("errInvalidId") };

  const supabase = createClient();
  const { error } = await supabase.from("bills").delete().eq("id", id.data);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

const createSchema = z.object({
  title: z.string().trim().min(1, "errTitleRequired").max(200),
  amount: z
    .union([z.number(), z.string()])
    .nullable()
    .transform((v) => {
      if (v === null || v === "") return null;
      const n = typeof v === "string" ? Number(v.replace(",", ".")) : v;
      return Number.isFinite(n) ? n : null;
    }),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "errInvalidDate"),
  category: z.enum(BILL_CATEGORIES).nullable(),
  custom_category: z.string().trim().max(60).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  group_id: z.string().uuid().nullable().optional(),
  document_url: z.string().nullable().optional(),
  document_path: z.string().nullable().optional(),
  extracted_raw: z.any().optional(),
  is_recurring: z.boolean().optional(),
  recurrence_unit: z.enum(RECURRENCE_UNITS).nullable().optional(),
  recurrence_interval: z
    .union([z.number(), z.string()])
    .nullable()
    .optional()
    .transform((v) => {
      if (v === null || v === undefined || v === "") return null;
      const n = typeof v === "string" ? parseInt(v, 10) : v;
      return Number.isFinite(n) ? Math.min(99, Math.max(1, Math.trunc(n))) : null;
    }),
  recurrence_amount_mode: z.enum(RECURRENCE_AMOUNT_MODES).nullable().optional(),
});

export type CreateBillInput = z.input<typeof createSchema>;

/**
 * Persists a new bill (used by the parse-confirm flow and the manual form).
 * Returns the new bill id so the caller can optionally create a calendar event.
 */
export async function createBill(
  input: CreateBillInput,
): Promise<ActionResult & { id?: string }> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: await translateActionError(parsed.error.issues[0]?.message) };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: await translateActionError("errInvalidSession") };

  if (parsed.data.category === "altro" && !parsed.data.custom_category?.trim()) {
    return { ok: false, error: await translateActionError("errCustomCategory") };
  }

  const { data, error } = await supabase
    .from("bills")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      amount: parsed.data.amount,
      due_date: parsed.data.due_date,
      category: parsed.data.category,
      custom_category:
        parsed.data.category === "altro"
          ? (parsed.data.custom_category?.trim() ?? null)
          : null,
      notes: parsed.data.notes ?? null,
      group_id: parsed.data.group_id ?? null,
      document_url: parsed.data.document_url ?? null,
      extracted_raw: parsed.data.extracted_raw ?? null,
      is_recurring: parsed.data.is_recurring ?? false,
      ...recurrenceColumns(
        parsed.data.is_recurring ?? false,
        parsed.data.recurrence_unit,
        parsed.data.recurrence_interval,
        parsed.data.recurrence_amount_mode,
      ),
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: await translateActionError(error?.message ?? "errSaveFailed") };
  }

  // Auto-add a Google Calendar reminder if the user is connected (best-effort;
  // never blocks the save — falls back to the manual button on the detail page).
  try {
    const { autoSyncBillToCalendar } = await import("@/lib/google/calendar");
    await autoSyncBillToCalendar(supabase, data as Bill);
  } catch {
    // ignore — bill is already saved
  }

  // Notify group members of a newly shared bill (fire-and-forget).
  if (data.group_id) {
    try {
      const { notifyGroupOfNewBill } = await import("@/lib/resend/notifications");
      await notifyGroupOfNewBill(data.id);
    } catch {
      // Notification failures must never block bill creation.
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  return { ok: true, id: data.id };
}

const updateSchema = createSchema.partial().extend({ id: idSchema });

export async function updateBill(
  input: z.input<typeof updateSchema>,
): Promise<ActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: await translateActionError(parsed.error.issues[0]?.message) };
  }
  const {
    id,
    document_path: _dp,
    extracted_raw,
    is_recurring,
    recurrence_unit,
    recurrence_interval,
    recurrence_amount_mode,
    ...fields
  } = parsed.data;

  // When is_recurring is part of the edit, recompute the recurrence columns.
  const recurrence =
    is_recurring === undefined
      ? {}
      : {
          is_recurring,
          ...recurrenceColumns(
            is_recurring,
            recurrence_unit,
            recurrence_interval,
            recurrence_amount_mode,
          ),
        };

  // Normalize custom_category against the category (only when category is edited).
  const categoryEdited = parsed.data.category !== undefined;
  if (
    categoryEdited &&
    parsed.data.category === "altro" &&
    !parsed.data.custom_category?.trim()
  ) {
    return { ok: false, error: await translateActionError("errCustomCategory") };
  }
  const customCategory = categoryEdited
    ? {
        custom_category:
          parsed.data.category === "altro"
            ? (parsed.data.custom_category?.trim() ?? null)
            : null,
      }
    : {};

  const supabase = createClient();
  const { error } = await supabase
    .from("bills")
    .update({ ...fields, extracted_raw, ...recurrence, ...customCategory })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath(`/bills/${id}`);
  return { ok: true };
}
