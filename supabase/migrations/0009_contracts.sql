create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  package_id uuid references public.packages(id) on delete set null,
  contract_number integer not null,
  contract_year integer not null default extract(year from current_date)::integer,
  status text not null default 'rascunho' check (status in ('rascunho','gerado','enviado','assinado','cancelado')),
  contractor_name text not null,
  contractor_document text,
  contractor_rg text,
  contractor_address text,
  contractor_phone text,
  contractor_email text,
  celebrant_name text,
  children_estimate integer,
  age_range text,
  event_theme text,
  event_date date,
  start_time time,
  end_time time,
  event_location text,
  event_location_type text,
  team_size integer not null default 1 check (team_size > 0),
  included_activities jsonb not null default '[]'::jsonb,
  included_equipment jsonb not null default '[]'::jsonb,
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  deposit_amount numeric(12,2) not null default 0 check (deposit_amount >= 0),
  deposit_date date,
  balance_amount numeric(12,2) not null default 0 check (balance_amount >= 0),
  balance_due_date date,
  payment_method text,
  pix_key text,
  additional_payment_terms text,
  arrival_minutes integer not null default 30 check (arrival_minutes >= 0),
  catering_required boolean not null default false,
  image_authorized boolean not null default false,
  additional_observations text,
  contract_details text,
  generated_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, contract_year, contract_number)
);

create index if not exists contracts_company_idx on public.contracts(company_id, contract_year, contract_number);
create index if not exists contracts_event_idx on public.contracts(event_id);
create index if not exists contracts_client_idx on public.contracts(client_id);

create trigger contracts_updated
before update on public.contracts
for each row execute function public.set_updated_at();

alter table public.contracts enable row level security;

create policy contracts_select on public.contracts
for select to authenticated
using (public.is_company_member(company_id));

create policy contracts_insert on public.contracts
for insert to authenticated
with check (public.is_company_member(company_id));

create policy contracts_update on public.contracts
for update to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

create policy contracts_delete on public.contracts
for delete to authenticated
using (public.is_company_admin(company_id));
