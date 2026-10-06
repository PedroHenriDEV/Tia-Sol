create extension if not exists pgcrypto;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null check (char_length(legal_name) between 2 and 160),
  trade_name text, tax_id text, phone text, whatsapp text, email text,
  address text, city text, state char(2), logo_path text, description text,
  contract_details text, bank_details text, pix_key text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, avatar_path text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create type public.company_role as enum ('owner','admin','finance','recreator','assistant');
create table public.company_members (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade, role public.company_role not null default 'owner',
  active boolean not null default true, created_at timestamptz not null default now(),
  unique(company_id,user_id)
);
create table public.settings (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  key text not null, value jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(company_id,key)
);
create index company_members_user_idx on public.company_members(user_id) where active;
create index company_members_company_idx on public.company_members(company_id) where active;
create index settings_company_idx on public.settings(company_id);

create function public.set_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
create trigger companies_updated before update on public.companies for each row execute function public.set_updated_at();
create trigger users_updated before update on public.users for each row execute function public.set_updated_at();
create trigger settings_updated before update on public.settings for each row execute function public.set_updated_at();

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.users(id,full_name) values(new.id,new.raw_user_meta_data->>'full_name'); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.is_company_member(target_company uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.company_members cm where cm.company_id=target_company and cm.user_id=(select auth.uid()) and cm.active);
$$;
create function public.is_company_admin(target_company uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.company_members cm where cm.company_id=target_company and cm.user_id=(select auth.uid()) and cm.active and cm.role in ('owner','admin'));
$$;
revoke all on function public.is_company_member(uuid) from public; grant execute on function public.is_company_member(uuid) to authenticated;
revoke all on function public.is_company_admin(uuid) from public; grant execute on function public.is_company_admin(uuid) to authenticated;

create function public.bootstrap_company(company_data jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare new_company_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if exists(select 1 from public.company_members where user_id=auth.uid() and active) then raise exception 'User already belongs to a company'; end if;
  insert into public.companies(legal_name,trade_name,tax_id,phone,whatsapp,email,address,city,state,description,contract_details,bank_details,pix_key)
  values(company_data->>'legal_name',nullif(company_data->>'trade_name',''),nullif(company_data->>'tax_id',''),nullif(company_data->>'phone',''),nullif(company_data->>'whatsapp',''),nullif(company_data->>'email',''),nullif(company_data->>'address',''),nullif(company_data->>'city',''),nullif(company_data->>'state',''),nullif(company_data->>'description',''),nullif(company_data->>'contract_details',''),nullif(company_data->>'bank_details',''),nullif(company_data->>'pix_key','')) returning id into new_company_id;
  insert into public.company_members(company_id,user_id,role) values(new_company_id,auth.uid(),'owner');
  insert into public.settings(company_id,key,value) values(new_company_id,'general','{}');
  return new_company_id;
end $$;
revoke all on function public.bootstrap_company(jsonb) from public; grant execute on function public.bootstrap_company(jsonb) to authenticated;

alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.company_members enable row level security;
alter table public.settings enable row level security;
create policy companies_select on public.companies for select to authenticated using (public.is_company_member(id));
create policy companies_update on public.companies for update to authenticated using (public.is_company_admin(id)) with check (public.is_company_admin(id));
create policy users_self_select on public.users for select to authenticated using (id=(select auth.uid()));
create policy users_self_update on public.users for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy members_select on public.company_members for select to authenticated using (public.is_company_member(company_id));
create policy members_admin_write on public.company_members for all to authenticated using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));
create policy settings_select on public.settings for select to authenticated using (public.is_company_member(company_id));
create policy settings_admin_write on public.settings for all to authenticated using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('company-assets','company-assets',false,5242880,array['image/png','image/jpeg','image/webp']) on conflict(id) do nothing;
create policy company_assets_select on storage.objects for select to authenticated using (bucket_id='company-assets' and public.is_company_member((storage.foldername(name))[1]::uuid));
create policy company_assets_insert on storage.objects for insert to authenticated with check (bucket_id='company-assets' and public.is_company_admin((storage.foldername(name))[1]::uuid));
create policy company_assets_update on storage.objects for update to authenticated using (bucket_id='company-assets' and public.is_company_admin((storage.foldername(name))[1]::uuid)) with check (bucket_id='company-assets' and public.is_company_admin((storage.foldername(name))[1]::uuid));
create policy company_assets_delete on storage.objects for delete to authenticated using (bucket_id='company-assets' and public.is_company_admin((storage.foldername(name))[1]::uuid));
