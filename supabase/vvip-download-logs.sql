-- Aiku Store: VVIP access/download audit log
-- Run after the existing Aiku Store schema.

create table if not exists public.vvip_access_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid,
  access_id uuid,
  email text not null,
  key_id uuid,
  used_key text,
  ip_address text,
  accessed_at timestamptz not null default now()
);

create index if not exists vvip_access_logs_product_id_idx
  on public.vvip_access_logs(product_id);

create index if not exists vvip_access_logs_email_idx
  on public.vvip_access_logs(email);

create index if not exists vvip_access_logs_accessed_at_idx
  on public.vvip_access_logs(accessed_at desc);

alter table public.vvip_access_logs enable row level security;

-- Admin/server-side code should read/write this table using the service role.
-- Do not expose the service-role key to the browser.
