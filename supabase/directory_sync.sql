-- Tradition Local Local Directory: lets the Simple Master sheet send the directory lists to the site.
-- Run once in Supabase: SQL Editor, New query, paste this file, Run. Safe to run again.
--
-- How it works: the sheet calls sync_directory with a private key you choose. If the key matches,
-- the function replaces the sponsors and providers with what is in the sheet. The key is stored
-- only as a one way hash, and nobody can read it from the website.
-- Run directory.sql and directory_sponsors.sql first.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.directory_sync_key (
  id boolean primary key default true check (id),   -- only ever one row
  hash text not null
);
alter table public.directory_sync_key enable row level security;   -- no policies: closed to the website
revoke all on public.directory_sync_key from anon, authenticated;

create or replace function public.sync_directory(secret text, sponsors jsonb, providers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  ok boolean;
  ns integer;
  np integer;
begin
  select (k.hash = encode(extensions.digest(coalesce(secret, ''), 'sha256'), 'hex')) into ok from public.directory_sync_key k limit 1;
  if ok is not true then
    perform pg_sleep(1);
    raise exception 'directory key does not match' using errcode = '28000';
  end if;
  if jsonb_typeof(sponsors) is distinct from 'array' or jsonb_typeof(providers) is distinct from 'array' then
    raise exception 'sponsors and providers must be lists';
  end if;

  delete from public.directory_sponsors where true;
  delete from public.directory_providers where true;

  insert into public.directory_sponsors (name, tagline, website, logo_url, service_area, is_main, sort_order, published)
  select trim(x.name), x.tagline, x.website, x.logo_url, x.service_area, coalesce(x.is_main, false), coalesce(x.sort_order, 100), coalesce(x.published, false)
  from jsonb_to_recordset(sponsors) as x(name text, tagline text, website text, logo_url text, service_area text, is_main boolean, sort_order integer, published boolean)
  where nullif(trim(x.name), '') is not null;
  get diagnostics ns = row_count;

  insert into public.directory_providers (category, name, contact_name, phone, email, website, service_area, why, sort_order, published)
  select trim(x.category), trim(x.name), x.contact_name, x.phone, x.email, x.website, x.service_area, x.why, coalesce(x.sort_order, 100), coalesce(x.published, false)
  from jsonb_to_recordset(providers) as x(category text, name text, contact_name text, phone text, email text, website text, service_area text, why text, sort_order integer, published boolean)
  where nullif(trim(x.name), '') is not null and nullif(trim(x.category), '') is not null;
  get diagnostics np = row_count;

  return jsonb_build_object('sponsors', ns, 'providers', np);
end;
$$;

revoke all on function public.sync_directory(text, jsonb, jsonb) from public;
grant execute on function public.sync_directory(text, jsonb, jsonb) to anon;

-- STEP 2, once: choose your own long private key (at least 16 characters, letters and numbers),
-- type it between the quotes below, remove the two dashes at the start of the three lines, and Run again.
-- Then type the same key into the sheet: Tradition Local, Save directory key.
--
-- insert into public.directory_sync_key (id, hash)
-- values (true, encode(extensions.digest('TYPE YOUR KEY HERE', 'sha256'), 'hex'))
-- on conflict (id) do update set hash = excluded.hash;
