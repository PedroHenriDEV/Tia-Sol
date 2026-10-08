create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  type text not null check (type in ('receita', 'despesa')),
  description text not null check (char_length(trim(description)) between 2 and 180),
  category text not null check (char_length(trim(category)) between 2 and 100),
  amount numeric(12,2) not null check (amount > 0),
  due_date date not null,
  paid_at timestamptz,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists financial_transactions_company_date_idx
  on public.financial_transactions(company_id, due_date);
create index if not exists financial_transactions_event_idx
  on public.financial_transactions(event_id);
create index if not exists financial_transactions_status_idx
  on public.financial_transactions(company_id, status);

drop trigger if exists financial_transactions_updated on public.financial_transactions;
create trigger financial_transactions_updated
before update on public.financial_transactions
for each row execute function public.set_updated_at();

alter table public.financial_transactions enable row level security;

drop policy if exists financial_transactions_select on public.financial_transactions;
create policy financial_transactions_select
on public.financial_transactions
for select to authenticated
using (public.is_company_member(company_id));

drop policy if exists financial_transactions_insert on public.financial_transactions;
create policy financial_transactions_insert
on public.financial_transactions
for insert to authenticated
with check (public.is_company_member(company_id));

drop policy if exists financial_transactions_update on public.financial_transactions;
create policy financial_transactions_update
on public.financial_transactions
for update to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

drop policy if exists financial_transactions_delete on public.financial_transactions;
create policy financial_transactions_delete
on public.financial_transactions
for delete to authenticated
using (public.is_company_admin(company_id));
