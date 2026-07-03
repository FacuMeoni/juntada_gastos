-- Invitaciones pendientes y permiso para que un miembro abandone la juntada.

alter table public.event_members
  add column if not exists status text not null default 'active'
    check (status in ('active', 'pending'));

alter table public.event_members
  add column if not exists invited_by uuid references public.users (id) on delete set null;

create index if not exists event_members_status_idx on public.event_members (status);

-- Solo miembros activos cuentan para acceder a gastos/pagos.
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
      and em.status = 'active'
  );
$$;

-- Ver metadata del evento si sos invitado pendiente o miembro activo.
drop policy if exists "events_select_member" on public.events;
create policy "events_select_member"
  on public.events for select
  using (
    created_by = auth.uid()
    or public.is_event_member(id)
    or exists (
      select 1
      from public.event_members em
      where em.event_id = events.id
        and em.user_id = auth.uid()
    )
  );

drop policy if exists "event_members_select" on public.event_members;
create policy "event_members_select"
  on public.event_members for select
  using (
    public.is_event_member(event_id)
    or public.is_event_owner(event_id)
    or user_id = auth.uid()
  );

drop policy if exists "event_members_delete" on public.event_members;
create policy "event_members_delete"
  on public.event_members for delete
  using (
    public.is_event_owner(event_id)
    or (user_id = auth.uid() and status in ('active', 'pending'))
  );

drop policy if exists "event_members_update" on public.event_members;
create policy "event_members_update"
  on public.event_members for update
  using (
    public.is_event_owner(event_id)
    or (user_id = auth.uid() and status = 'pending')
  )
  with check (
    public.is_event_owner(event_id)
    or (user_id = auth.uid() and status = 'active')
  );
