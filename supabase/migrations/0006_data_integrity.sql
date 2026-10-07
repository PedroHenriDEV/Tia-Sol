-- Corrige contas criadas antes da migration de fundacao e garante integridade dos vinculos financeiros.

insert into public.users (id, full_name)
select au.id, au.raw_user_meta_data->>'full_name'
from auth.users au
on conflict (id) do nothing;

create or replace function public.validate_financial_event_company()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.event_id is not null and not exists (
    select 1
    from public.events e
    where e.id = new.event_id
      and e.company_id = new.company_id
  ) then
    raise exception 'O evento informado não pertence à empresa atual.';
  end if;

  return new;
end;
$$;

drop trigger if exists financial_transactions_event_company_check
on public.financial_transactions;

create trigger financial_transactions_event_company_check
before insert or update on public.financial_transactions
for each row execute function public.validate_financial_event_company();

revoke all on function public.validate_financial_event_company() from public;
grant execute on function public.validate_financial_event_company() to authenticated;
