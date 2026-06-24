import { addDays, addMonths, addWeeks, addYears, format, parseISO } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { Bill, RecurrenceUnit } from "@/types";

type Client = SupabaseClient<Database>;

/** Next due date given a unit (week/month/year) and an interval (every N units). */
export function getNextDueDate(
  currentDueDate: string,
  unit: RecurrenceUnit,
  interval: number,
): string {
  const d = parseISO(currentDueDate);
  const n = Math.max(1, Math.trunc(interval) || 1);
  const next =
    unit === "week" ? addWeeks(d, n) : unit === "year" ? addYears(d, n) : addMonths(d, n);
  return format(next, "yyyy-MM-dd");
}

/**
 * Creates the next occurrence of a recurring bill based on its recurrence
 * settings, unless one already exists near the expected date (dedup ±3 days).
 * Returns the new bill id, or null when nothing was created.
 *
 * The whole chain shares one `recurring_anchor_id` = the original bill's id.
 * Legacy recurring bills without explicit settings default to monthly.
 */
export async function ensureNextRecurrence(
  supabase: Client,
  bill: Bill,
): Promise<string | null> {
  if (!bill.is_recurring) return null;

  const anchorId = bill.recurring_anchor_id ?? bill.id;
  const unit: RecurrenceUnit = bill.recurrence_unit ?? "month";
  const interval = bill.recurrence_interval ?? 1;
  const amountMode = bill.recurrence_amount_mode ?? "same";

  const nextDate = getNextDueDate(bill.due_date, unit, interval);

  // Dedup: any child of this chain within ±3 days of the expected date?
  const windowLo = format(addDays(parseISO(nextDate), -3), "yyyy-MM-dd");
  const windowHi = format(addDays(parseISO(nextDate), 3), "yyyy-MM-dd");
  const { data: existing } = await supabase
    .from("bills")
    .select("id")
    .eq("recurring_anchor_id", anchorId)
    .gte("due_date", windowLo)
    .lte("due_date", windowHi)
    .limit(1);

  if (existing && existing.length > 0) return null;

  const { data, error } = await supabase
    .from("bills")
    .insert({
      user_id: bill.user_id,
      group_id: bill.group_id,
      title: bill.title,
      amount: amountMode === "same" ? bill.amount : null,
      category: bill.category,
      due_date: nextDate,
      status: "pending",
      is_recurring: true,
      recurring_anchor_id: anchorId,
      recurrence_unit: unit,
      recurrence_interval: interval,
      recurrence_amount_mode: amountMode,
      notes: bill.notes,
    })
    .select("*")
    .single();

  if (error || !data) return null;

  // Auto-add a Calendar reminder for the generated occurrence too (best-effort).
  try {
    const { autoSyncBillToCalendar } = await import("@/lib/google/calendar");
    await autoSyncBillToCalendar(supabase, data as Bill);
  } catch {
    // ignore — occurrence is already created
  }

  return data.id;
}

/**
 * Cron fallback (Momento B): for every recurring bill due *today*, make sure
 * the next occurrence exists — even if the user never marked it paid.
 * Uses the service-role client (runs outside any user session).
 * Returns how many new records were created.
 */
export async function processRecurringBills(): Promise<number> {
  const admin = createAdminClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: dueToday } = await admin
    .from("bills")
    .select("*")
    .eq("is_recurring", true)
    .eq("due_date", today);

  let created = 0;
  for (const bill of dueToday ?? []) {
    const id = await ensureNextRecurrence(admin, bill as Bill);
    if (id) created += 1;
  }
  return created;
}
