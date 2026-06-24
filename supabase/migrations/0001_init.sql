-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ BillTracker — initial schema                                               ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

create extension if not exists "pgcrypto";

-- ─── Tables ───────────────────────────────────────────────────────────────────

-- Profile row per auth user (created automatically by trigger, see below).
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  email text,
  email_reminders boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.family_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid references public.family_groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'member')) default 'member',
  primary key (group_id, user_id)
);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  group_id uuid references public.family_groups(id) on delete set null,
  title text not null,
  amount numeric(10, 2),
  due_date date not null,
  category text check (category in (
    'luce', 'gas', 'acqua', 'condominio',
    'telefono', 'internet', 'mav', 'imu',
    'assicurazione', 'altro'
  )),
  status text not null check (status in ('pending', 'paid', 'overdue')) default 'pending',
  paid_at timestamptz,
  document_url text,
  calendar_event_id text,
  notes text,
  extracted_raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Per-user Google OAuth tokens for Calendar integration.
create table if not exists public.google_credentials (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  access_token text not null,
  refresh_token text,
  scope text,
  token_type text,
  expiry_date bigint,
  updated_at timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists bills_user_due_idx on public.bills (user_id, due_date);
create index if not exists bills_group_due_idx on public.bills (group_id, due_date);
create index if not exists bills_status_idx on public.bills (status);
create index if not exists group_members_user_idx on public.group_members (user_id);

-- ─── Helper functions (SECURITY DEFINER avoids RLS recursion) ──────────────────

create or replace function public.is_group_member(p_group uuid, p_user uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group and gm.user_id = p_user
  );
$$;

create or replace function public.shares_group(p_user uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members a
    join public.group_members b on a.group_id = b.group_id
    where a.user_id = auth.uid() and b.user_id = p_user
  );
$$;

-- ─── Triggers ──────────────────────────────────────────────────────────────────

-- Auto-provision a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, 'utente'), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep bills.updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bills_touch_updated_at on public.bills;
create trigger bills_touch_updated_at
  before update on public.bills
  for each row execute function public.touch_updated_at();

-- ─── Row Level Security ─────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.family_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.bills enable row level security;
alter table public.google_credentials enable row level security;

-- profiles: own row, plus profiles of people who share a group with me.
drop policy if exists "profiles self or co-member" on public.profiles;
create policy "profiles self or co-member" on public.profiles
  for select using (id = auth.uid() or public.shares_group(id));

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles insert self" on public.profiles;
create policy "profiles insert self" on public.profiles
  for insert with check (id = auth.uid());

-- family_groups: visible to owner and members; only owner mutates.
drop policy if exists "groups visible to members" on public.family_groups;
create policy "groups visible to members" on public.family_groups
  for select using (owner_id = auth.uid() or public.is_group_member(id, auth.uid()));

drop policy if exists "groups insert by owner" on public.family_groups;
create policy "groups insert by owner" on public.family_groups
  for insert with check (owner_id = auth.uid());

drop policy if exists "groups update by owner" on public.family_groups;
create policy "groups update by owner" on public.family_groups
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "groups delete by owner" on public.family_groups;
create policy "groups delete by owner" on public.family_groups
  for delete using (owner_id = auth.uid());

-- group_members: members can see co-members; owner manages membership.
drop policy if exists "members see co-members" on public.group_members;
create policy "members see co-members" on public.group_members
  for select using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "owner manages members" on public.group_members;
create policy "owner manages members" on public.group_members
  for all
  using (
    exists (
      select 1 from public.family_groups g
      where g.id = group_id and g.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.family_groups g
      where g.id = group_id and g.owner_id = auth.uid()
    )
  );

-- bills: own bills, or bills shared with a group I belong to.
drop policy if exists "bills access" on public.bills;
create policy "bills access" on public.bills
  for all
  using (
    auth.uid() = user_id
    or (group_id is not null and public.is_group_member(group_id, auth.uid()))
  )
  with check (
    auth.uid() = user_id
    or (group_id is not null and public.is_group_member(group_id, auth.uid()))
  );

-- google_credentials: strictly the owner.
drop policy if exists "google creds self" on public.google_credentials;
create policy "google creds self" on public.google_credentials
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── Storage (private bucket for original documents) ────────────────────────────

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "documents read own" on storage.objects;
create policy "documents read own" on storage.objects
  for select using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "documents insert own" on storage.objects;
create policy "documents insert own" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "documents delete own" on storage.objects;
create policy "documents delete own" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
