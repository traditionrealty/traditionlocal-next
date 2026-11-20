-- Tradition Local member events: the events a member marked Going or Interested, kept with their account.
-- Run once in Supabase: SQL Editor, New query, paste this file, Run. Safe to run again.
-- Run member_lists.sql first. The privacy rules from schema.sql still apply: a member can only read and change their own row.

alter table public.profiles add column if not exists going_events jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists interested_events jsonb not null default '[]'::jsonb;

alter table public.profiles drop constraint if exists profiles_member_events_ok;
alter table public.profiles add constraint profiles_member_events_ok check (
  public.member_list_ok(going_events, 200, 120)
  and public.member_list_ok(interested_events, 200, 120)
);

grant update (going_events, interested_events) on public.profiles to authenticated;

comment on column public.profiles.going_events is 'Slugs of the events the member is going to. Written by the site when they are signed in.';
comment on column public.profiles.interested_events is 'Slugs of the events the member is interested in.';
