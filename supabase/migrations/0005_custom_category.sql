-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ BillTracker — categoria personalizzata (quando category = 'altro')         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Testo libero mostrato al posto di "Altro" (es. "Abbonamento palestra").
alter table public.bills
  add column if not exists custom_category text;
