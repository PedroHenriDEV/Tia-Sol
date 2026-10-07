create or replace function public.get_my_profile()
returns public.users
language sql
stable
security definer
set search_path = public
as $$
  select u.*
  from public.users u
  where u.id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_my_profile() from public;
grant execute on function public.get_my_profile() to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-assets',
  'user-assets',
  false,
  5242880,
  array['image/png','image/jpeg','image/webp']
)
on conflict (id) do nothing;

drop policy if exists user_assets_select on storage.objects;
create policy user_assets_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'user-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists user_assets_insert on storage.objects;
create policy user_assets_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'user-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists user_assets_update on storage.objects;
create policy user_assets_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'user-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'user-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists user_assets_delete on storage.objects;
create policy user_assets_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'user-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

grant select, update on public.users to authenticated;
