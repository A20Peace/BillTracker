import { endOfMonth, format, startOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { Bill } from "@/types";

/** Pending/overdue bills, soonest first (used by the homepage "next due" list). */
export async function getUpcomingBills(limit = 30): Promise<Bill[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("bills")
    .select("*")
    .in("status", ["pending", "overdue"])
    .order("due_date", { ascending: true })
    .limit(limit);
  return (data ?? []) as Bill[];
}

export interface MonthSummary {
  toPay: number; // unpaid bills due this month
  paid: number; // bills paid this month (by paid_at)
  overdue: number; // unpaid + past due, within this month
  total: number; // toPay + paid
}

/** Current-month financial summary for the homepage. */
export async function getCurrentMonthSummary(): Promise<MonthSummary> {
  const supabase = createClient();
  const now = new Date();
  const mStart = format(startOfMonth(now), "yyyy-MM-dd");
  const mEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const today = format(now, "yyyy-MM-dd");

  const [{ data: dueThisMonth }, { data: paidThisMonth }] = await Promise.all([
    supabase
      .from("bills")
      .select("amount, status, due_date")
      .gte("due_date", mStart)
      .lte("due_date", mEnd),
    supabase
      .from("bills")
      .select("amount")
      .eq("status", "paid")
      .gte("paid_at", startOfMonth(now).toISOString())
      .lte("paid_at", endOfMonth(now).toISOString()),
  ]);

  const due = dueThisMonth ?? [];
  const sum = (rows: { amount: number | null }[]) =>
    rows.reduce((s, r) => s + (r.amount ?? 0), 0);

  const toPay = sum(due.filter((r) => r.status === "pending" || r.status === "overdue"));
  const overdue = sum(
    due.filter(
      (r) =>
        r.status === "overdue" ||
        (r.status === "pending" && (r.due_date as string) < today),
    ),
  );
  const paid = sum(paidThisMonth ?? []);

  return { toPay, paid, overdue, total: toPay + paid };
}
