-- Quién registró el pago en la app (event_members.id).
alter table public.payments
  add column if not exists created_by uuid references public.event_members (id) on delete set null;

create index if not exists payments_created_by_idx on public.payments (created_by);
