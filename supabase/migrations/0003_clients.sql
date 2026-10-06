create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 160),
  document text,
  phone text,
  whatsapp text,
  email text,
  address text,
  city text,
  state char(2),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_company_idx on public.clients(company_id);
create index if not exists clients_name_idx on public.clients(company_id, lower(name));

create trigger clients_updated
before update on public.clients
for each row execute function public.set_updated_at();

alter table public.clients enable row level security;

create policy clients_select on public.clients
for select to authenticated
using (public.is_company_member(company_id));

create policy clients_insert on public.clients
for insert to authenticated
with check (public.is_company_member(company_id));

create policy clients_update on public.clients
for update to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

create policy clients_delete on public.clients
for delete to authenticated
using (public.is_company_admin(company_id));