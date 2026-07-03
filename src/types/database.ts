/**
 * Minimal typed Database definition for the Supabase client.
 *
 * This is a hand-written subset compatible with `@supabase/supabase-js`
 * generics. For a fully generated version run:
 *   supabase gen types typescript --project-id <id> > src/types/database.ts
 */
import type {
  BenchmarkCategory,
  BillCategory,
  BillStatus,
  GroupRole,
  ParsedDocument,
  RecurrenceAmountMode,
  RecurrenceUnit,
} from "./index";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          email: string | null;
          email_reminders: boolean;
          reminder_email: string | null;
          auto_calendar: boolean;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          email?: string | null;
          email_reminders?: boolean;
          reminder_email?: string | null;
          auto_calendar?: boolean;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          email?: string | null;
          email_reminders?: boolean;
          reminder_email?: string | null;
          auto_calendar?: boolean;
          is_admin?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      sent_reminders: {
        Row: {
          id: string;
          bill_id: string | null;
          kind: string;
          sent_at: string;
        };
        Insert: {
          id?: string;
          bill_id?: string | null;
          kind: string;
          sent_at?: string;
        };
        Update: {
          id?: string;
          bill_id?: string | null;
          kind?: string;
          sent_at?: string;
        };
        Relationships: [];
      };
      family_groups: {
        Row: {
          id: string;
          name: string;
          owner_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: GroupRole;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: GroupRole;
        };
        Update: {
          group_id?: string;
          user_id?: string;
          role?: GroupRole;
        };
        Relationships: [];
      };
      bills: {
        Row: {
          id: string;
          user_id: string | null;
          group_id: string | null;
          title: string;
          amount: number | null;
          due_date: string;
          category: BillCategory | null;
          custom_category: string | null;
          status: BillStatus;
          paid_at: string | null;
          document_url: string | null;
          calendar_event_id: string | null;
          notes: string | null;
          extracted_raw: ParsedDocument | null;
          is_recurring: boolean;
          recurring_anchor_id: string | null;
          recurrence_unit: RecurrenceUnit | null;
          recurrence_interval: number | null;
          recurrence_amount_mode: RecurrenceAmountMode | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          group_id?: string | null;
          title: string;
          amount?: number | null;
          due_date: string;
          category?: BillCategory | null;
          custom_category?: string | null;
          status?: BillStatus;
          paid_at?: string | null;
          document_url?: string | null;
          calendar_event_id?: string | null;
          notes?: string | null;
          extracted_raw?: ParsedDocument | null;
          is_recurring?: boolean;
          recurring_anchor_id?: string | null;
          recurrence_unit?: RecurrenceUnit | null;
          recurrence_interval?: number | null;
          recurrence_amount_mode?: RecurrenceAmountMode | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          group_id?: string | null;
          title?: string;
          amount?: number | null;
          due_date?: string;
          category?: BillCategory | null;
          custom_category?: string | null;
          status?: BillStatus;
          paid_at?: string | null;
          document_url?: string | null;
          calendar_event_id?: string | null;
          notes?: string | null;
          extracted_raw?: ParsedDocument | null;
          is_recurring?: boolean;
          recurring_anchor_id?: string | null;
          recurrence_unit?: RecurrenceUnit | null;
          recurrence_interval?: number | null;
          recurrence_amount_mode?: RecurrenceAmountMode | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      google_credentials: {
        Row: {
          user_id: string;
          access_token: string;
          refresh_token: string | null;
          scope: string | null;
          token_type: string | null;
          expiry_date: number | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          access_token: string;
          refresh_token?: string | null;
          scope?: string | null;
          token_type?: string | null;
          expiry_date?: number | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          access_token?: string;
          refresh_token?: string | null;
          scope?: string | null;
          token_type?: string | null;
          expiry_date?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          key: string;
          value: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      benchmark_proposals: {
        Row: {
          id: string;
          category: BenchmarkCategory;
          period: string;
          avg_monthly_eur: number;
          source_url: string | null;
          notes: string | null;
          auto_extracted: boolean;
          status: "pending" | "approved" | "rejected";
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          category: BenchmarkCategory;
          period: string;
          avg_monthly_eur: number;
          source_url?: string | null;
          notes?: string | null;
          auto_extracted?: boolean;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          category?: BenchmarkCategory;
          period?: string;
          avg_monthly_eur?: number;
          source_url?: string | null;
          notes?: string | null;
          auto_extracted?: boolean;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
          reviewed_at?: string | null;
        };
        Relationships: [];
      };
      market_benchmarks: {
        Row: {
          id: string;
          category: BenchmarkCategory;
          period: string;
          avg_monthly_eur: number;
          source_url: string | null;
          notes: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: BenchmarkCategory;
          period: string;
          avg_monthly_eur: number;
          source_url?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: BenchmarkCategory;
          period?: string;
          avg_monthly_eur?: number;
          source_url?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
