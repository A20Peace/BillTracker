-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ BillTracker — ruolo amministratore (is_admin) sui profili                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Flag amministratore: solo chi ha is_admin = true può aggiornare i benchmark.
-- Default false → nessun utente è admin finché non lo imposti a mano dal
-- Table Editor di Supabase (profiles → tuo record → is_admin = true).
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- ─── Protezione: un utente NON può auto-promuoversi admin ───────────────────────
-- La policy RLS "profiles update self" consente a ciascuno di aggiornare la
-- propria riga; senza questa salvaguardia un utente potrebbe settare
-- is_admin = true via API. Il trigger ripristina il valore precedente per
-- qualsiasi UPDATE che porti un JWT utente (auth.uid() non nullo). Gli
-- aggiornamenti via service-role / Table Editor (auth.uid() nullo) restano liberi.
create or replace function public.protect_is_admin()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin and auth.uid() is not null then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_is_admin on public.profiles;
create trigger profiles_protect_is_admin
  before update on public.profiles
  for each row execute function public.protect_is_admin();
