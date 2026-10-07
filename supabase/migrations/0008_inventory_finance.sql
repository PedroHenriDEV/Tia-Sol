create or replace function public.register_material_purchase(
  p_material_id uuid,
  p_event_id uuid,
  p_quantity numeric,
  p_unit_cost numeric,
  p_reason text,
  p_due_date date,
  p_status text default 'pago'
)
returns public.material_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_material public.materials%rowtype;
  v_movement public.material_movements%rowtype;
  v_company_id uuid;
  v_new_quantity numeric(12,2);
  v_amount numeric(12,2);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'A quantidade deve ser maior que zero.';
  end if;

  if p_unit_cost is null or p_unit_cost <= 0 then
    raise exception 'Informe um custo unitário válido para registrar uma compra.';
  end if;

  if p_status not in ('pendente', 'pago') then
    raise exception 'Status financeiro inválido.';
  end if;

  if p_due_date is null then
    raise exception 'Informe a data de vencimento.';
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
  v_new_quantity := v_material.quantity + p_quantity;
  v_amount := round((p_quantity * p_unit_cost)::numeric, 2);

  if p_event_id is not null and not exists (
    select 1
    from public.events e
    where e.id = p_event_id
      and e.company_id = v_company_id
  ) then
    raise exception 'O evento informado não pertence à empresa atual.';
  end if;

  update public.materials
  set quantity = v_new_quantity,
      unit_cost = p_unit_cost,
      updated_at = now()
  where id = p_material_id;

  insert into public.material_movements (
    company_id, material_id, event_id, type, quantity, unit_cost, reason
  )
  values (
    v_company_id, p_material_id, p_event_id, 'entrada', p_quantity, p_unit_cost, trim(p_reason)
  )
  returning * into v_movement;

  insert into public.financial_transactions (
    company_id,
    event_id,
    type,
    description,
    category,
    amount,
    due_date,
    paid_at,
    status,
    notes
  )
  values (
    v_company_id,
    p_event_id,
    'despesa',
    'Compra de ' || v_material.name,
    'Materiais e estoque',
    v_amount,
    p_due_date,
    case when p_status = 'pago' then now() else null end,
    p_status,
    trim(p_reason)
  );

  return v_movement;
end;
$$;

revoke all on function public.register_material_purchase(uuid, uuid, numeric, numeric, text, date, text) from public;
grant execute on function public.register_material_purchase(uuid, uuid, numeric, numeric, text, date, text) to authenticated;
