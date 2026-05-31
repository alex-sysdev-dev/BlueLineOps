create extension if not exists pgcrypto;

create table if not exists public.contact_sales_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text not null,
  phone text not null,
  role text not null,
  use_case text not null,
  newsletter_opt_in boolean not null default true,
  source text not null default 'contact_sales_form',
  status text not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_sales_requests_status_check
    check (status in ('new', 'contacted', 'qualified', 'closed', 'archived'))
);

create index if not exists contact_sales_requests_created_at_idx
  on public.contact_sales_requests (created_at desc);

create index if not exists contact_sales_requests_email_idx
  on public.contact_sales_requests (email);

create index if not exists contact_sales_requests_newsletter_idx
  on public.contact_sales_requests (newsletter_opt_in, created_at desc);

alter table public.contact_sales_requests enable row level security;

revoke all on table public.contact_sales_requests from anon, authenticated;
grant select, insert, update on table public.contact_sales_requests to service_role;
