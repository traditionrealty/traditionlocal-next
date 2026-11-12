-- Tradition Local Local Directory: the members only list of providers.
-- Run once in Supabase: SQL Editor, New query, paste this file, Run.
-- Safe to run again; it only creates what is missing.
--
-- Who can see it: any signed in member (their email is confirmed before they can sign in).
-- Who can change it: only you, in the Supabase Table Editor. The website can never add, edit, or delete rows.

create table if not exists public.directory_providers (
  id uuid primary key default gen_random_uuid(),
  category text not null,            -- the kind of help, for example Home inspector or Mortgage lender
  name text not null,                -- the business or person
  contact_name text,                 -- who to ask for, if it is a business
  phone text,
  email text,
  website text,
  service_area text,                 -- for example Greater Houston, or Katy and Cypress
  why text,                          -- why you would call them, in your own words
  sort_order integer not null default 100,   -- lower numbers show first within a category
  published boolean not null default false,  -- tick this to show the row to members
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.directory_providers is 'Local Directory providers. Members read published rows on /local-directory. Edit in the Table Editor.';

alter table public.directory_providers enable row level security;

drop policy if exists "Members can read published providers" on public.directory_providers;
create policy "Members can read published providers"
  on public.directory_providers for select to authenticated
  using (published = true);

-- Visitors who are not signed in get nothing. Members can only read. Nobody can write from the website.
revoke all on public.directory_providers from anon;
revoke all on public.directory_providers from authenticated;
grant select on public.directory_providers to authenticated;

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

drop trigger if exists directory_providers_touch_updated_at on public.directory_providers;
create trigger directory_providers_touch_updated_at
  before update on public.directory_providers
  for each row execute function public.touch_updated_at();
