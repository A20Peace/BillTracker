-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ BillTracker — spese ricorrenti                                             ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Flag "spesa ricorrente" + collegamento alla bill originale della catena.
alter table public.bills
  add column if not exists is_recurring boolean not null default false;

alter table public.bills
  add column if not exists recurring_anchor_id uuid references public.bills(id) on delete set null;

-- Velocizza la deduplica (ricerca dei figli di una catena per mese).
create index if not exists bills_recurring_anchor_idx
  on public.bills (recurring_anchor_id, due_date);
