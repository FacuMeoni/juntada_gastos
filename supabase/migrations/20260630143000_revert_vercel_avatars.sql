-- Revertir avatares Vercel: iniciales por defecto o foto subida / OAuth.

drop function if exists public.default_avatar_url(uuid, text);

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

update public.users
set avatar_url = null
where avatar_url like '%avatar.vercel.sh%';
