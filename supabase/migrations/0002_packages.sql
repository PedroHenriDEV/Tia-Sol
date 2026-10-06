create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  description text,
  price numeric(12,2) not null default 0 check (price >= 0),
  duration integer not null check (duration > 0),
  activities jsonb not null default '[]'::jsonb,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists packages_company_idx on public.packages(company_id);
create index if not exists packages_active_idx on public.packages(company_id, active);

create trigger packages_updated before update on public.packages for each row execute function public.set_updated_at();

alter table public.packages enable row level security;

create policy packages_select on public.packages for select to authenticated
using (public.is_company_member(company_id));

create policy packages_insert on public.packages for insert to authenticated
with check (public.is_company_member(company_id) and public.is_company_admin(company_id));

create policy packages_update on public.packages for update to authenticated
using (public.is_company_member(company_id) and public.is_company_admin(company_id))
with check (public.is_company_member(company_id) and public.is_company_admin(company_id));

create policy packages_delete on public.packages for delete to authenticated
using (public.is_company_member(company_id) and public.is_company_admin(company_id));
