-- 0013_signup_company_bootstrap.sql
-- Garante que novos usuários tenham uma empresa e vínculo owner
-- automaticamente após o cadastro. O sistema é de uso individual.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company_id uuid;
  profile_name text;
begin
  profile_name := nullif(trim(new.raw_user_meta_data->>'full_name'), '');

  insert into public.users(id, full_name)
  values (new.id, profile_name)
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, public.users.full_name);

  if not exists (
    select 1
    from public.company_members
    where user_id = new.id
      and active
  ) then
    insert into public.companies (
      legal_name,
      trade_name,
      email
    )
    values (
      coalesce(profile_name, 'Tia Sol'),
      coalesce(profile_name, 'Tia Sol'),
      new.email
    )
    returning id into new_company_id;

    insert into public.company_members (company_id, user_id, role)
    values (new_company_id, new.id, 'owner');

    insert into public.settings (company_id, key, value)
    values (new_company_id, 'general', '{}'::jsonb);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to authenticated;