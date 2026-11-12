-- Tradition Local Local Directory: sponsors.
-- Run once in Supabase: SQL Editor, New query, paste this file, Run.
-- Safe to run again; it only creates what is missing.
--
-- Who can see it: everyone (sponsors are public). Only published rows are shown.
-- Who can change it: only you, in the Supabase Table Editor. The website can never add, edit, or delete rows.

create table if not exists public.directory_sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,                -- the sponsor
  tagline text,                      -- what they do, in one line
  website text,                      -- their website
  logo_url text,                     -- a link to their logo image (https, or a path on this site such as /images/sponsors/name.png)
  sort_order integer not null default 100,   -- lower numbers show first
  published boolean not null default false,  -- tick this to show the sponsor on the site
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.directory_sponsors is 'Local Directory sponsors. Public, published rows only. Edit in the Table Editor.';

alter table public.directory_sponsors enable row level security;

drop policy if exists "Anyone can read published sponsors" on public.directory_sponsors;
create policy "Anyone can read published sponsors"
  on public.directory_sponsors for select to anon, authenticated
  using (published = true);

revoke all on public.directory_sponsors from anon;
revoke all on public.directory_sponsors from authenticated;
grant select on public.directory_sponsors to anon, authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists directory_sponsors_touch_updated_at on public.directory_sponsors;
create trigger directory_sponsors_touch_updated_at
  before update on public.directory_sponsors
  for each row execute function public.touch_updated_at();
