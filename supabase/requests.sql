-- Where Ask Dillon and Contact requests are saved. Run this once in the Supabase SQL editor.
-- Anyone can add a request through the public key, and nobody can read them from the website.
-- View and export them in the Supabase Table Editor.
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('ask', 'contact')),
  name text,
  email text not null,
  message text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.requests enable row level security;
drop policy if exists "Anyone can send a request" on public.requests;
create policy "Anyone can send a request" on public.requests for insert to anon, authenticated with check (true);
grant insert on public.requests to anon, authenticated;
