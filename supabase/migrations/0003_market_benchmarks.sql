-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ BillTracker — benchmark di mercato (ARERA / AGCOM)                         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

create table if not exists public.market_benchmarks (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('luce', 'gas', 'telefono', 'internet')),
  period text not null,                    -- es. '2025-Q1'
  avg_monthly_eur numeric(8, 2) not null,  -- media mensile in €
  source_url text,
  notes text,
  updated_at timestamptz not null default now()
);

-- Un solo valore per categoria+periodo.
create unique index if not exists market_benchmarks_cat_period_uq
  on public.market_benchmarks (category, period);

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- Dati di riferimento: lettura per qualsiasi utente autenticato.
-- Le scritture passano solo dalla service-role key (server action admin),
-- quindi NON definiamo policy di insert/update/delete.
alter table public.market_benchmarks enable row level security;

drop policy if exists "benchmarks readable by authenticated" on public.market_benchmarks;
create policy "benchmarks readable by authenticated" on public.market_benchmarks
  for select using (auth.uid() is not null);

-- ─── Dati iniziali ────────────────────────────────────────────────────────────
-- ⚠️ VALORI PLACEHOLDER: vanno verificati e aggiornati ogni trimestre dalla
-- pagina /settings/benchmarks (oppure qui via SQL).
--   Luce/Gas → ARERA "Prezzi di riferimento": https://www.arera.it/it/prezzi.htm
--   Telefono/Internet → AGCOM "Osservatorio prezzi": https://www.agcom.it
insert into public.market_benchmarks (category, period, avg_monthly_eur, source_url, notes) values
  ('luce',     '2025-Q1', 68.00, 'https://www.arera.it', 'PLACEHOLDER — Famiglia tipo 2700 kWh/anno, mercato tutelato. Verificare su ARERA.'),
  ('gas',      '2025-Q1', 85.00, 'https://www.arera.it', 'PLACEHOLDER — Famiglia tipo 1400 Smc/anno, mercato tutelato. Verificare su ARERA.'),
  ('telefono', '2025-Q1', 12.00, 'https://www.agcom.it', 'PLACEHOLDER — SIM dati, media offerte principali. Verificare su AGCOM.'),
  ('internet', '2025-Q1', 28.00, 'https://www.agcom.it', 'PLACEHOLDER — FTTH/FTTC, media offerte principali. Verificare su AGCOM.')
on conflict (category, period) do nothing;
