import { endOfMonth, format, startOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { Bill, BillCategory } from "@/types";

export type StatusFilter = "all" | "unpaid" | "paid" | "overdue";

export interface BillFilters {
  category?: BillCategory | null;
  status?: StatusFilter;
  month?: string | null; // YYYY-MM
}

const todayISO = () => format(new Date(), "yyyy-MM-dd");

/**
 * Lists the current user's bills (own + shared via group, enforced by RLS),
 * applying the dashboard filters. Ordered by due date ascending.
 */
export async function listBills(filters: BillFilters = {}): Promise<Bill[]> {
  const supabase = createClient();
  let query = supabase.from("bills").select("*").order("due_date", { ascending: true });

  if (filters.category) query = query.eq("category", filters.category);

  switch (filters.status) {
    case "paid":
      query = query.eq("status", "paid");
      break;
    case "unpaid":
      query = query.in("status", ["pending", "overdue"]);
      break;
    case "overdue":
      query = query.in("status", ["pending", "overdue"]).lt("due_date", todayISO());
      break;
    default:
      break;
  }

  if (filters.month && /^\d{4}-\d{2}$/.test(filters.month)) {
    const base = new Date(`${filters.month}-01T00:00:00`);
    query = query
      .gte("due_date", format(startOfMonth(base), "yyyy-MM-dd"))
      .lte("due_date", format(endOfMonth(base), "yyyy-MM-dd"));
  }

  const { data, error } = await query;
  if (error) throw new Error(`Errore nel caricamento delle scadenze: ${error.message}`);
  return (data ?? []) as Bill[];
}

export interface DashboardStats {
  dueNext30Total: number;
  dueNext30Count: number;
  unpaidCount: number;
  paidThisMonthTotal: number;
}

/** Aggregated header stats for the dashboard. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const in30 = new Date(today);
  in30.setDate(in30.getDate() + 30);
  const in30Str = format(in30, "yyyy-MM-dd");

  // Pull the minimal columns we need and aggregate in JS (small datasets).
  const [{ data: upcoming }, { data: unpaid }, { data: paid }] = await Promise.all([
    supabase
      .from("bills")
      .select("amount")
      .in("status", ["pending", "overdue"])
      .gte("due_date", todayStr)
      .lte("due_date", in30Str),
    supabase.from("bills").select("id").in("status", ["pending", "overdue"]),
    supabase
      .from("bills")
      .select("amount, paid_at")
      .eq("status", "paid")
      .gte("paid_at", startOfMonth(today).toISOString())
      .lte("paid_at", endOfMonth(today).toISOString()),
  ]);

  const sum = (rows: { amount: number | null }[] | null) =>
    (rows ?? []).reduce((acc, r) => acc + (r.amount ?? 0), 0);

  return {
    dueNext30Total: sum(upcoming),
    dueNext30Count: (upcoming ?? []).length,
    unpaidCount: (unpaid ?? []).length,
    paidThisMonthTotal: sum(paid),
  };
}
