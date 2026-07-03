-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ BillTracker — proposte di aggiornamento dei benchmark di mercato           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Il cron /api/cron/benchmark-proposals raccoglie ogni trimestre i nuovi prezzi
-- medi (ARERA per luce/gas; per internet/telefono ripropone l'ultimo valore da
-- verificare) e li salva qui come "pending". L'amministratore li rivede su
-- /settings/benchmarks e li approva o rifiuta: solo all'approvazione il valore
-- finisce in market_benchmarks, mai in automatico.
create table if not exists public.benchmark_proposals (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('luce', 'gas', 'telefono', 'internet')),
  period text not null,                    -- es. '2026-Q3'
  avg_monthly_eur numeric(8, 2) not null,  -- valore proposto, €/mese
  source_url text,
  notes text,
  -- true = estratto automaticamente dalla fonte; false = riproposta del valore
  -- precedente da verificare a mano.
  auto_extracted boolean not null default false,
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- Una sola proposta pendente per categoria+periodo (l'indice parziale consente
-- di riproporre dopo un rifiuto senza violare l'unicità).
create unique index if not exists benchmark_proposals_pending_uq
  on public.benchmark_proposals (category, period)
  where status = 'pending';

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- Materiale di lavoro dell'amministratore: lettura solo admin (riusa la
-- funzione is_admin() della migration 0009). Le scritture passano solo dal
-- service role (cron e server action), quindi nessuna policy di write.
alter table public.benchmark_proposals enable row level security;

drop policy if exists "proposals readable by admin" on public.benchmark_proposals;
create policy "proposals readable by admin" on public.benchmark_proposals
  for select using (public.is_admin());
