-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ BillTracker — ricorrenza flessibile (settimana/mese/anno, ogni N)          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

alter table public.bills
  add column if not exists recurrence_unit text
    check (recurrence_unit in ('week', 'month', 'year')),
  add column if not exists recurrence_interval integer default 1,
  add column if not exists recurrence_amount_mode text
    check (recurrence_amount_mode in ('same', 'empty')) default 'same';

-- recurrence_unit:        'week' | 'month' | 'year'
-- recurrence_interval:    1, 2, 3 … (ogni N unità)
-- recurrence_amount_mode: 'same' = copia l'importo, 'empty' = importo null

-- Backfill: le bollette già ricorrenti diventano mensili (comportamento precedente).
update public.bills
  set recurrence_unit = 'month', recurrence_interval = coalesce(recurrence_interval, 1)
  where is_recurring = true and recurrence_unit is null;
