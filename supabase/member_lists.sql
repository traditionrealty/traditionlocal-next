-- Tradition Local member lists: saved places, followed areas, and home area, kept with the member's account.
-- Run once in Supabase: SQL Editor, New query, paste this file, Run. Safe to run again.
--
-- It adds three fields to each member's row in the profiles table. The privacy rules from schema.sql still apply:
-- a member can only read and change their own row. Visitors who are not signed in can read and change nothing.

alter table public.profiles add column if not exists saved_places jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists followed_areas jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists home_area text;

-- Keep the lists tidy: a list of short text items, a sensible size, nothing else.
create or replace function public.member_list_ok(j jsonb, max_items integer, max_len integer)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when jsonb_typeof(j) is distinct from 'array' then false
    when jsonb_array_length(j) > max_items then false
    else not exists (
      select 1 from jsonb_array_elements(j) e
      where jsonb_typeof(e) is distinct from 'string' or length(e #>> '{}') > max_len
    )
  end;
$$;

alter table public.profiles drop constraint if exists profiles_member_lists_ok;
alter table public.profiles add constraint profiles_member_lists_ok check (
  public.member_list_ok(saved_places, 500, 120)
  and public.member_list_ok(followed_areas, 100, 120)
  and length(coalesce(home_area, '')) <= 80
);

-- Let members change these three fields. The update rule on the table already limits it to their own row.
grant update (saved_places, followed_areas, home_area) on public.profiles to authenticated;

comment on column public.profiles.saved_places is 'Slugs of the places the member saved. Written by the site when they are signed in.';
comment on column public.profiles.followed_areas is 'Names of the areas the member follows.';
comment on column public.profiles.home_area is 'The area the member calls home.';
