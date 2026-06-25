-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ BillTracker — notifiche: email reminder dedicata, toggle auto-calendar,    ║
-- ║ tracciamento email inviate (deduplica)                                     ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Indirizzo email su cui ricevere i reminder (può differire da quello di login).
alter table public.profiles
  add column if not exists reminder_email text;

-- Permette di disattivare la creazione automatica eventi senza scollegare Google.
alter table public.profiles
  add column if not exists auto_calendar boolean not null default true;

-- Traccia ogni reminder inviato per evitare invii doppi.
--   kind: 'd14','d7','d3','d2','d1','d0' (pre-scadenza, una volta sola)
--         'overdue:YYYY-MM-DD'           (post-scadenza, una volta al giorno)
create table if not exists public.sent_reminders (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid references public.bills(id) on delete cascade,
  kind text not null,
  sent_at timestamptz not null default now()
);

create unique index if not exists sent_reminders_bill_kind_uq
  on public.sent_reminders (bill_id, kind);

-- Scritta/letta solo dal cron (service-role): RLS attiva, nessuna policy.
alter table public.sent_reminders enable row level security;
