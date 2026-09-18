-- Ticket/foto opcional en gastos + bucket de storage.

alter table public.expenses
  add column if not exists receipt_url text;

-- Bucket público (misma idea que avatares): lectura simple en la UI.
insert into storage.buckets (id, name, public)
values ('expense-receipts', 'expense-receipts', true)
on conflict (id) do nothing;

drop policy if exists "expense_receipts_public_read" on storage.objects;
create policy "expense_receipts_public_read"
  on storage.objects for select
  using (bucket_id = 'expense-receipts');

drop policy if exists "expense_receipts_member_insert" on storage.objects;
create policy "expense_receipts_member_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'expense-receipts'
    and auth.uid() is not null
    and (
      public.is_event_member((storage.foldername(name))[1]::uuid)
      or public.is_event_owner((storage.foldername(name))[1]::uuid)
    )
  );

drop policy if exists "expense_receipts_member_update" on storage.objects;
create policy "expense_receipts_member_update"
  on storage.objects for update
  using (
    bucket_id = 'expense-receipts'
    and auth.uid() is not null
    and (
      public.is_event_member((storage.foldername(name))[1]::uuid)
      or public.is_event_owner((storage.foldername(name))[1]::uuid)
    )
  );

drop policy if exists "expense_receipts_member_delete" on storage.objects;
create policy "expense_receipts_member_delete"
  on storage.objects for delete
  using (
    bucket_id = 'expense-receipts'
    and auth.uid() is not null
    and (
      public.is_event_member((storage.foldername(name))[1]::uuid)
      or public.is_event_owner((storage.foldername(name))[1]::uuid)
    )
  );
