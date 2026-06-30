-- Quién cargó el gasto en la app (event_members.id), distinto de paid_by.
alter table public.expenses
  add column if not exists created_by uuid references public.event_members (id) on delete set null;

create index if not exists expenses_created_by_idx on public.expenses (created_by);
