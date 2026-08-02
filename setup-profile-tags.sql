-- Previous Save profile tags: table, normalization, limits, and RLS
create extension if not exists pgcrypto;

create table if not exists public.profile_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tag text not null,
  normalized_tag text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists profile_tags_user_normalized_unique
on public.profile_tags(user_id, normalized_tag);

create index if not exists profile_tags_normalized_index
on public.profile_tags(normalized_tag);

create or replace function public.prepare_profile_tag()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.tag := trim(regexp_replace(regexp_replace(new.tag, '^#+', ''), '\s+', ' ', 'g'));
  new.normalized_tag := lower(new.tag);

  if char_length(new.tag) < 1 or char_length(new.tag) > 24 then
    raise exception 'Tags must be between 1 and 24 characters.';
  end if;

  if new.tag !~ '^[[:alnum:]][[:alnum:] &+.''_-]*$' then
    raise exception 'Tag contains unsupported characters.';
  end if;

  if tg_op = 'INSERT' and (
    select count(*) from public.profile_tags where user_id = new.user_id
  ) >= 8 then
    raise exception 'Profiles can have no more than 8 tags.';
  end if;

  return new;
end;
$$;

drop trigger if exists prepare_profile_tag_trigger on public.profile_tags;
create trigger prepare_profile_tag_trigger
before insert or update on public.profile_tags
for each row execute function public.prepare_profile_tag();

alter table public.profile_tags enable row level security;

do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname='public' and tablename='profile_tags'
  loop
    execute format('drop policy if exists %I on public.profile_tags', p.policyname);
  end loop;
end $$;

create policy "Profile tags are publicly viewable"
on public.profile_tags for select
to anon, authenticated
using (true);

create policy "Users can add their own profile tags"
on public.profile_tags for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own profile tags"
on public.profile_tags for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own profile tags"
on public.profile_tags for delete
to authenticated
using (auth.uid() = user_id);

grant select on public.profile_tags to anon, authenticated;
grant insert, update, delete on public.profile_tags to authenticated;
