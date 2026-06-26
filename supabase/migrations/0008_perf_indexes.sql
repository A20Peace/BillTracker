-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ BillTracker — indici aggiuntivi per le query più frequenti                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Esistenti (0001): bills(user_id, due_date), bills(group_id, due_date),
--                   bills(status), group_members(user_id).
-- Qui aggiungiamo i compositi che servono alle viste dashboard/home/cron.

-- Dashboard stats + lista "prossime scadenze" + cron: filtrano per status e
-- ordinano/filtrano per due_date.
create index if not exists bills_status_due_idx
  on public.bills (status, due_date);

-- Conteggi e filtri "le mie scadenze per stato".
create index if not exists bills_user_status_idx
  on public.bills (user_id, status);

-- "Pagato questo mese": filtra status = 'paid' e intervallo su paid_at.
create index if not exists bills_paid_at_idx
  on public.bills (paid_at)
  where status = 'paid';
