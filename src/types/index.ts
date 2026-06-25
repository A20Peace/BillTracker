/**
 * Domain types for BillTracker.
 *
 * These mirror the PostgreSQL schema (see supabase/migrations) and are the
 * single source of truth used across server actions, API routes and UI.
 */

// ─── Enums (kept in sync with the DB CHECK constraints) ──────────────────────

export const BILL_CATEGORIES = [
  "luce",
  "gas",
  "acqua",
  "condominio",
  "telefono",
  "internet",
  "mav",
  "imu",
  "assicurazione",
  "altro",
] as const;

export type BillCategory = (typeof BILL_CATEGORIES)[number];

export const BILL_STATUSES = ["pending", "paid", "overdue"] as const;
export type BillStatus = (typeof BILL_STATUSES)[number];

export const GROUP_ROLES = ["owner", "member"] as const;
export type GroupRole = (typeof GROUP_ROLES)[number];

export const RECURRENCE_UNITS = ["week", "month", "year"] as const;
export type RecurrenceUnit = (typeof RECURRENCE_UNITS)[number];

export const RECURRENCE_AMOUNT_MODES = ["same", "empty"] as const;
export type RecurrenceAmountMode = (typeof RECURRENCE_AMOUNT_MODES)[number];

/** Categories that have a public market benchmark (ARERA / AGCOM). */
export const BENCHMARK_CATEGORIES = ["luce", "gas", "telefono", "internet"] as const;
export type BenchmarkCategory = (typeof BENCHMARK_CATEGORIES)[number];

export function isBenchmarkCategory(c: unknown): c is BenchmarkCategory {
  return (
    typeof c === "string" &&
    (BENCHMARK_CATEGORIES as readonly string[]).includes(c)
  );
}

// ─── Row shapes ──────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  email_reminders: boolean;
  /** Optional address for reminders (falls back to `email`). */
  reminder_email: string | null;
  /** When false, calendar events are NOT auto-created on bill save. */
  auto_calendar: boolean;
  created_at: string;
}

export interface FamilyGroup {
  id: string;
  name: string;
  owner_id: string | null;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: GroupRole;
}

export interface Bill {
  id: string;
  user_id: string | null;
  group_id: string | null;
  title: string;
  amount: number | null;
  due_date: string; // ISO date (YYYY-MM-DD)
  category: BillCategory | null;
  /** Free text shown instead of "Altro" when category === "altro". */
  custom_category: string | null;
  status: BillStatus;
  paid_at: string | null;
  document_url: string | null;
  calendar_event_id: string | null;
  notes: string | null;
  extracted_raw: ParsedDocument | Record<string, unknown> | null;
  is_recurring: boolean;
  /** Points to the original bill of a recurring chain (null on the anchor). */
  recurring_anchor_id: string | null;
  recurrence_unit: RecurrenceUnit | null;
  recurrence_interval: number | null;
  recurrence_amount_mode: RecurrenceAmountMode | null;
  created_at: string;
  updated_at: string;
}

// ─── Document parsing ────────────────────────────────────────────────────────

/**
 * Shape Claude is instructed to return from a parsed bill/document.
 * Every field can be `null` when not detectable.
 */
export interface ParsedDocument {
  title: string | null;
  amount: number | null;
  due_date: string | null; // YYYY-MM-DD
  category: BillCategory | null;
  issuer: string | null;
  confidence: number | null;
}

// ─── API contracts ───────────────────────────────────────────────────────────

export interface ParseResponse {
  parsed: ParsedDocument;
  documentUrl: string;
  documentPath: string;
}

export interface ApiError {
  error: string;
  code?: string;
}

// ─── Market benchmarks (ARERA / AGCOM) ───────────────────────────────────────

export interface MarketBenchmark {
  id: string;
  category: BenchmarkCategory;
  period: string; // es. "2025-Q1"
  avg_monthly_eur: number;
  source_url: string | null;
  notes: string | null;
  updated_at: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

/** One month bucket with a total per category, used by the analytics charts. */
export interface MonthlySpending {
  month: string; // YYYY-MM
  total: number;
  byCategory: Partial<Record<BillCategory, number>>;
}
