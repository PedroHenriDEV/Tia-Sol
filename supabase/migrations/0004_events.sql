create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  package_id uuid references public.packages(id) on delete set null,
  title text not null check (char_length(trim(title)) between 2 and 180),
  event_date date not null,
  start_time time not null,
  end_time time not null,
  location text,
  status text not null default 'aguardando_confirmacao' check (status in (
    'orcamento','aguardando_confirmacao','confirmado','contrato_gerado',
    'contrato_assinado','pagamento_parcial','pagamento_completo',
    'realizado','finalizado','cancelado'
  )),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  received_amount numeric(12,2) not null default 0 check (received_amount >= 0 and received_amount <= total_amount),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_time_order check (end_time > start_time)
);

create index if not exists events_company_date_idx on public.events(company_id, event_date);
create index if not exists events_client_idx on public.events(client_id);
create index if not exists events_package_idx on public.events(package_id);

create trigger events_updated
before update on public.events
for each row execute function public.set_updated_at();

alter table public.events enable row level security;

create policy events_select on public.events
for select to authenticated
using (public.is_company_member(company_id));

create policy events_insert on public.events
for insert to authenticated
with check (public.is_company_member(company_id));

create policy events_update on public.events
for update to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

create policy events_delete on public.events
for delete to authenticated
using (public.is_company_admin(company_id));

create or replace function public.has_event_conflict(
  p_company_id uuid,
  p_event_date date,
  p_start_time time,
  p_end_time time,
  p_exclude_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    where e.company_id = p_company_id
      and e.event_date = p_event_date
      and e.status <> 'cancelado'
      and (p_exclude_id is null or e.id <> p_exclude_id)
      and e.start_time < p_end_time
      and e.end_time > p_start_time
  );
$$;

grant execute on function public.has_event_conflict(uuid, date, time, time, uuid) to authenticated;