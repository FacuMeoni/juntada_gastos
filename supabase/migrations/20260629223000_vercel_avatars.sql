-- Avatares por defecto con avatar.vercel.sh (gradiente único por usuario).
-- OAuth (Google) conserva su picture si viene en metadata.

create or replace function public.default_avatar_url(_id uuid, _name text)
returns text
language sql
immutable
set search_path = public
as $$
  select
    'https://avatar.vercel.sh/'
    || _id::text
    || '.svg?size=128&text='
    || upper(left(coalesce(nullif(trim(_name), ''), 'U'), 2));
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _name text;
begin
  _name := coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1));

  insert into public.users (id, name, avatar_url)
  values (
    new.id,
    _name,
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      public.default_avatar_url(new.id, _name)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Usuarios existentes sin foto: asignar avatar generado.
update public.users
set avatar_url = public.default_avatar_url(id, name)
where avatar_url is null or trim(avatar_url) = '';
