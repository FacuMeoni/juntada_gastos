-- Miembros activos pueden invitar amigos (membership pending).

drop policy if exists "event_members_insert" on public.event_members;
create policy "event_members_insert"
  on public.event_members for insert
  with check (
    public.is_event_owner(event_id)
    or (user_id = auth.uid())
    or (
      public.is_event_member(event_id)
      and user_id is not null
      and user_id <> auth.uid()
      and status = 'pending'
      and invited_by = auth.uid()
    )
  );
