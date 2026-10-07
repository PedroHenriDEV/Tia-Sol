-- Hardening de segurança das funções RPC usadas pela aplicação.
-- A função de conflito é SECURITY DEFINER, portanto deve validar explicitamente
-- que o usuário autenticado pertence à empresa consultada.

create or replace function public.has_event_conflict(
  p_company_id uuid,
  p_event_date date,
  p_start_time time,
  p_end_time time,
  p_exclude_id uuid default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_company_member(p_company_id) then
    raise exception 'Acesso não autorizado à empresa.';
  end if;

  return exists (
    select 1
    from public.events e
    where e.company_id = p_company_id
      and e.event_date = p_event_date
      and e.status <> 'cancelado'
      and (p_exclude_id is null or e.id <> p_exclude_id)
      and e.start_time < p_end_time
      and e.end_time > p_start_time
  );
end;
$$;

revoke all on function public.has_event_conflict(uuid, date, time, time, uuid) from public;
grant execute on function public.has_event_conflict(uuid, date, time, time, uuid) to authenticated;
