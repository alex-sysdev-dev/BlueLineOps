create extension if not exists pgcrypto;

create table if not exists public.request_access_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text not null,
  role text not null,
  access_need text not null,
  team_size text not null default '',
  request_reason text not null default '',
  newsletter_opt_in boolean not null default true,
  source text not null default 'request_access_form',
  status text not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint request_access_requests_status_check
    check (status in ('new', 'reviewing', 'approved', 'denied', 'archived'))
);

create index if not exists request_access_requests_created_at_idx
  on public.request_access_requests (created_at desc);

create index if not exists request_access_requests_email_idx
  on public.request_access_requests (email);

create index if not exists request_access_requests_status_idx
  on public.request_access_requests (status, created_at desc);

alter table public.request_access_requests enable row level security;

revoke all on table public.request_access_requests from anon, authenticated;
grant select, insert, update on table public.request_access_requests to service_role;
