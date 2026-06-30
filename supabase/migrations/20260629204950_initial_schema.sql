-- =============================================================================
-- JuntadasApp — Esquema de base de datos (Supabase / PostgreSQL)
-- =============================================================================
-- Modelo híbrido: un participante de un evento (event_member) puede ser un
-- usuario real (con cuenta) o un invitado gestionado a mano (guest_name).
-- expenses y payments SIEMPRE referencian event_members.id, nunca users.id,
-- para que los cálculos de saldos funcionen igual en ambos casos.
-- =============================================================================

-- Extensiones --------------------------------------------------------------
create extension if not exists "pgcrypto";

-- =============================================================================
-- 1. users  (perfil real, 1:1 con auth.users)
-- =============================================================================
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null default '',
  alias_cvu   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

comment on table public.users is 'Perfil público del usuario, espejo de auth.users';

-- =============================================================================
-- 2. events  (la juntada)
-- =============================================================================
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid not null references public.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists events_created_by_idx on public.events (created_by);

-- =============================================================================
-- 3. event_members  (la clave del sistema: une un evento con una persona)
--    - user_id NULL  -> invitado gestionado a mano (usar guest_name)
--    - user_id NOT NULL -> usuario real con cuenta
-- =============================================================================
create table if not exists public.event_members (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  user_id     uuid references public.users (id) on delete set null,
  guest_name  text,
  created_at  timestamptz not null default now(),

  -- Debe tener identidad: o es usuario real, o tiene nombre de invitado.
  constraint event_member_identity_check
    check (user_id is not null or guest_name is not null),

  -- Un usuario real no puede estar dos veces en el mismo evento.
  constraint event_member_unique_user
    unique (event_id, user_id)
);

create index if not exists event_members_event_idx on public.event_members (event_id);
create index if not exists event_members_user_idx  on public.event_members (user_id);

-- =============================================================================
-- 4. expenses  (un gasto pagado por un event_member)
-- =============================================================================
create table if not exists public.expenses (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events (id) on delete cascade,
  paid_by         uuid not null references public.event_members (id) on delete cascade,
  description     text not null,
  amount          numeric(12, 2) not null check (amount > 0),
  created_at      timestamptz not null default now()
);

create index if not exists expenses_event_idx   on public.expenses (event_id);
create index if not exists expenses_paid_by_idx on public.expenses (paid_by);

-- 4.b expense_splits  (cómo se reparte cada gasto entre los participantes)
--     Permite divisiones desiguales. Si un gasto no tiene splits, la lógica
--     de la app lo divide en partes iguales entre todos los miembros.
create table if not exists public.expense_splits (
  id          uuid primary key default gen_random_uuid(),
  expense_id  uuid not null references public.expenses (id) on delete cascade,
  member_id   uuid not null references public.event_members (id) on delete cascade,
  amount      numeric(12, 2) not null check (amount >= 0),

  constraint expense_split_unique unique (expense_id, member_id)
);

create index if not exists expense_splits_expense_idx on public.expense_splits (expense_id);
create index if not exists expense_splits_member_idx  on public.expense_splits (member_id);

-- =============================================================================
-- 5. payments  (un pago/saldo entre dos event_members)
-- =============================================================================
create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  from_member   uuid not null references public.event_members (id) on delete cascade,
  to_member     uuid not null references public.event_members (id) on delete cascade,
  amount        numeric(12, 2) not null check (amount > 0),
  created_at    timestamptz not null default now(),

  constraint payment_distinct_members check (from_member <> to_member)
);

create index if not exists payments_event_idx on public.payments (event_id);

-- =============================================================================
-- HELPERS (security definer para evitar recursión en políticas RLS)
-- =============================================================================
create or replace function public.is_event_member(_event_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.event_members em
    where em.event_id = _event_id
      and em.user_id = auth.uid()
  );
$$;

create or replace function public.is_event_owner(_event_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    where e.id = _event_id
      and e.created_by = auth.uid()
  );
$$;

-- =============================================================================
-- TRIGGER: crear fila en public.users cuando se registra un auth.users
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.users          enable row level security;
alter table public.events         enable row level security;
alter table public.event_members  enable row level security;
alter table public.expenses       enable row level security;
alter table public.expense_splits enable row level security;
alter table public.payments       enable row level security;

-- ---- users ----------------------------------------------------------------
drop policy if exists "users_select_self" on public.users;
create policy "users_select_self"
  on public.users for select
  using (true);  -- perfiles visibles (nombre/avatar) para mostrar en juntadas

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "users_insert_self" on public.users;
create policy "users_insert_self"
  on public.users for insert
  with check (id = auth.uid());

-- ---- events ---------------------------------------------------------------
drop policy if exists "events_select_member" on public.events;
create policy "events_select_member"
  on public.events for select
  using (created_by = auth.uid() or public.is_event_member(id));

drop policy if exists "events_insert_owner" on public.events;
create policy "events_insert_owner"
  on public.events for insert
  with check (created_by = auth.uid());

drop policy if exists "events_update_owner" on public.events;
create policy "events_update_owner"
  on public.events for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists "events_delete_owner" on public.events;
create policy "events_delete_owner"
  on public.events for delete
  using (created_by = auth.uid());

-- ---- event_members --------------------------------------------------------
drop policy if exists "event_members_select" on public.event_members;
create policy "event_members_select"
  on public.event_members for select
  using (public.is_event_member(event_id) or public.is_event_owner(event_id));

drop policy if exists "event_members_insert" on public.event_members;
create policy "event_members_insert"
  on public.event_members for insert
  with check (
    -- el dueño puede agregar a cualquiera (invitados gestionados)
    public.is_event_owner(event_id)
    -- o un usuario se agrega a sí mismo (flujo de invitación)
    or (user_id = auth.uid())
  );

drop policy if exists "event_members_delete" on public.event_members;
create policy "event_members_delete"
  on public.event_members for delete
  using (public.is_event_owner(event_id));

drop policy if exists "event_members_update" on public.event_members;
create policy "event_members_update"
  on public.event_members for update
  using (public.is_event_owner(event_id))
  with check (public.is_event_owner(event_id));

-- ---- expenses -------------------------------------------------------------
drop policy if exists "expenses_select" on public.expenses;
create policy "expenses_select"
  on public.expenses for select
  using (public.is_event_member(event_id) or public.is_event_owner(event_id));

drop policy if exists "expenses_write" on public.expenses;
create policy "expenses_write"
  on public.expenses for all
  using (public.is_event_member(event_id) or public.is_event_owner(event_id))
  with check (public.is_event_member(event_id) or public.is_event_owner(event_id));

-- ---- expense_splits -------------------------------------------------------
drop policy if exists "expense_splits_select" on public.expense_splits;
create policy "expense_splits_select"
  on public.expense_splits for select
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id
        and (public.is_event_member(e.event_id) or public.is_event_owner(e.event_id))
    )
  );

drop policy if exists "expense_splits_write" on public.expense_splits;
create policy "expense_splits_write"
  on public.expense_splits for all
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id
        and (public.is_event_member(e.event_id) or public.is_event_owner(e.event_id))
    )
  )
  with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id
        and (public.is_event_member(e.event_id) or public.is_event_owner(e.event_id))
    )
  );

-- ---- payments -------------------------------------------------------------
drop policy if exists "payments_select" on public.payments;
create policy "payments_select"
  on public.payments for select
  using (public.is_event_member(event_id) or public.is_event_owner(event_id));

drop policy if exists "payments_write" on public.payments;
create policy "payments_write"
  on public.payments for all
  using (public.is_event_member(event_id) or public.is_event_owner(event_id))
  with check (public.is_event_member(event_id) or public.is_event_owner(event_id));

-- =============================================================================
-- STORAGE: bucket para avatares
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_user_write" on storage.objects;
create policy "avatars_user_write"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() is not null);

drop policy if exists "avatars_user_update" on storage.objects;
create policy "avatars_user_update"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid() is not null);
