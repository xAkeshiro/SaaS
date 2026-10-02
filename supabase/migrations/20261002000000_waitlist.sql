-- Waitlist and Teams pilot requests (roadmap Phase 0).
-- Only the server writes these, with the project's secret key. Row-level security is on and there are
-- no policies, so the publishable key used in browsers can neither read nor write either table.

create extension if not exists citext with schema extensions;

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email extensions.citext not null unique,
  source text not null default 'web',
  campus text,
  -- The separate "invite me to the beta" step. Joining the waitlist alone means one email at launch.
  beta_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint waitlist_email_length check (char_length(email::text) <= 254),
  constraint waitlist_source_length check (char_length(source) <= 64),
  constraint waitlist_campus_length check (campus is null or char_length(campus) <= 120)
);

alter table public.waitlist enable row level security;

comment on table public.waitlist is 'Launch waitlist. One email at launch; beta invites only when beta_opt_in is true.';

create table public.pilot_requests (
  id uuid primary key default gen_random_uuid(),
  email extensions.citext not null,
  name text,
  org text,
  seats text,
  notes text,
  created_at timestamptz not null default now(),
  constraint pilot_requests_email_length check (char_length(email::text) <= 254),
  constraint pilot_requests_field_length check (
    coalesce(char_length(name), 0) <= 500
    and coalesce(char_length(org), 0) <= 500
    and coalesce(char_length(seats), 0) <= 500
    and coalesce(char_length(notes), 0) <= 500
  )
);

alter table public.pilot_requests enable row level security;

comment on table public.pilot_requests is 'Teams pilot requests from /teams. The owner is emailed on each one.';

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

create trigger waitlist_touch_updated_at
before update on public.waitlist
for each row execute function public.touch_updated_at();
