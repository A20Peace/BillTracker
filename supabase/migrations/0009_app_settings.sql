-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ BillTracker — impostazioni globali dell'app (pagina Contattaci)            ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Configurazioni globali modificabili dall'amministratore senza toccare il
-- codice. Struttura chiave/valore generica: oggi contiene i dati della pagina
-- Contattaci, domani può ospitare altre impostazioni senza nuove migrazioni.
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Riusa il trigger touch_updated_at definito in 0001_init.sql.
drop trigger if exists app_settings_touch_updated_at on public.app_settings;
create trigger app_settings_touch_updated_at
  before update on public.app_settings
  for each row execute function public.touch_updated_at();

-- ─── Helper: l'utente corrente è amministratore? ─────────────────────────────
-- SECURITY DEFINER: legge profiles bypassando RLS, così la policy su
-- app_settings non dipende dalle policy di select di profiles.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- Lettura: pubblica (la pagina Contattaci è visibile anche ai non loggati).
-- Scrittura: solo profili con is_admin = true. Nessuna policy di delete:
-- le chiavi si aggiornano, non si eliminano.
alter table public.app_settings enable row level security;

drop policy if exists "app settings readable by everyone" on public.app_settings;
create policy "app settings readable by everyone" on public.app_settings
  for select using (true);

drop policy if exists "app settings insert by admin" on public.app_settings;
create policy "app settings insert by admin" on public.app_settings
  for insert with check (public.is_admin());

drop policy if exists "app settings update by admin" on public.app_settings;
create policy "app settings update by admin" on public.app_settings
  for update using (public.is_admin()) with check (public.is_admin());

-- ─── Dati iniziali ────────────────────────────────────────────────────────────
-- ⚠️ VALORI PLACEHOLDER: da sostituire al primo accesso dalla pagina
-- /settings/contact (area amministratore).
insert into public.app_settings (key, value) values
  ('contact_first_name', 'Nome'),
  ('contact_last_name',  'Cognome'),
  ('contact_email',      'contatto@example.com'),
  ('contact_phone',      '+39 000 000 0000')
on conflict (key) do nothing;
