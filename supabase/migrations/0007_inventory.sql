create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 180),
  category text not null default 'Geral' check (char_length(trim(category)) between 2 and 100),
  unit text not null default 'unidade' check (char_length(trim(unit)) between 1 and 30),
  quantity numeric(12,2) not null default 0 check (quantity >= 0),
  minimum_quantity numeric(12,2) not null default 0 check (minimum_quantity >= 0),
  unit_cost numeric(12,2) not null default 0 check (unit_cost >= 0),
  location text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.material_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  type text not null check (type in ('entrada', 'saida')),
  quantity numeric(12,2) not null check (quantity > 0),
  unit_cost numeric(12,2) check (unit_cost is null or unit_cost >= 0),
  reason text not null check (char_length(trim(reason)) between 2 and 180),
  created_at timestamptz not null default now()
);

create index if not exists materials_company_name_idx
  on public.materials(company_id, name);
create index if not exists materials_company_active_idx
  on public.materials(company_id, active);
create index if not exists material_movements_material_date_idx
  on public.material_movements(material_id, created_at desc);
create index if not exists material_movements_company_date_idx
  on public.material_movements(company_id, created_at desc);

drop trigger if exists materials_updated on public.materials;
create trigger materials_updated
before update on public.materials
for each row execute function public.set_updated_at();

alter table public.materials enable row level security;
alter table public.material_movements enable row level security;

drop policy if exists materials_select on public.materials;
create policy materials_select on public.materials
for select to authenticated
using (public.is_company_member(company_id));

drop policy if exists materials_insert on public.materials;
create policy materials_insert on public.materials
for insert to authenticated
with check (public.is_company_member(company_id));

drop policy if exists materials_update on public.materials;
create policy materials_update on public.materials
for update to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

drop policy if exists materials_delete on public.materials;
create policy materials_delete on public.materials
for delete to authenticated
using (public.is_company_admin(company_id));

drop policy if exists material_movements_select on public.material_movements;
create policy material_movements_select on public.material_movements
for select to authenticated
using (public.is_company_member(company_id));

drop policy if exists material_movements_insert on public.material_movements;
create policy material_movements_insert on public.material_movements
for insert to authenticated
with check (public.is_company_member(company_id));

create or replace function public.register_material_movement(
  p_material_id uuid,
  p_event_id uuid,
  p_type text,
  p_quantity numeric,
  p_reason text,
  p_unit_cost numeric default null
)
returns public.material_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_material public.materials%rowtype;
  v_movement public.material_movements%rowtype;
  v_new_quantity numeric(12,2);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_type not in ('entrada', 'saida') then
    raise exception 'Tipo de movimentação inválido.';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'A quantidade deve ser maior que zero.';
  end if;

  select m.*
    into v_material
  from public.materials m
  where m.id = p_material_id
    and public.is_company_member(m.company_id)
  for update;

  if not found then
    raise exception 'Material não encontrado.';
  end if;

  v_company_id := v_material.company_id;

  if p_event_id is not null and not exists (
    select 1 from public.events e
    where e.id = p_event_id and e.company_id = v_company_id
  ) then
    raise exception 'O evento informado não pertence à empresa atual.';
  end if;

  if p_type = 'saida' then
    v_new_quantity := v_material.quantity - p_quantity;
    if v_new_quantity < 0 then
      raise exception 'Estoque insuficiente. Disponível: % %.', v_material.quantity, v_material.unit;
    end if;
  else
    v_new_quantity := v_material.quantity + p_quantity;
  end if;

  update public.materials
  set quantity = v_new_quantity,
      updated_at = now()
  where id = p_material_id;

  insert into public.material_movements (
    company_id, material_id, event_id, type, quantity, unit_cost, reason
  )
  values (
    v_company_id, p_material_id, p_event_id, p_type, p_quantity, p_unit_cost, trim(p_reason)
  )
  returning * into v_movement;

  return v_movement;
end;
$$;

revoke all on function public.register_material_movement(uuid, uuid, text, numeric, text, numeric) from public;
grant execute on function public.register_material_movement(uuid, uuid, text, numeric, text, numeric) to authenticated;
