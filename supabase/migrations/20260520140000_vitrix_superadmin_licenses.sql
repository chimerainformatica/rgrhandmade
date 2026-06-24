create table if not exists public.vitrix_license_state (
  site_id text primary key,
  status text not null default 'missing' check (status in ('active', 'trial', 'expired', 'suspended', 'missing')),
  plan text,
  enabled_modules text[] not null default array[]::text[],
  expires_at timestamptz,
  last_checked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.vitrix_roles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%owner%'
      and pg_get_constraintdef(oid) like '%viewer%'
  loop
    execute format('alter table public.vitrix_roles drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.vitrix_roles
  add constraint vitrix_roles_name_check
  check (name in ('superadmin', 'owner', 'admin', 'editor', 'viewer'));

create or replace function public.vitrix_is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.vitrix_user_roles ur
    join public.vitrix_roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = 'superadmin'
  );
$$;

revoke all on function public.vitrix_is_superadmin() from public;
grant execute on function public.vitrix_is_superadmin() to authenticated;

alter table public.vitrix_license_state enable row level security;

drop policy if exists "Vitrix read license state" on public.vitrix_license_state;
create policy "Vitrix read license state"
  on public.vitrix_license_state for select
  to authenticated
  using (public.vitrix_has_permission('vitrix.read'));

drop policy if exists "Vitrix manage license state" on public.vitrix_license_state;
create policy "Vitrix manage license state"
  on public.vitrix_license_state for all
  to authenticated
  using (public.vitrix_has_permission('license.manage'))
  with check (public.vitrix_has_permission('license.manage'));

drop policy if exists "Vitrix manage user roles" on public.vitrix_user_roles;

drop policy if exists "Vitrix read user roles" on public.vitrix_user_roles;
create policy "Vitrix read user roles"
  on public.vitrix_user_roles for select
  to authenticated
  using (public.vitrix_has_permission('users.manage'));

drop policy if exists "Vitrix insert user roles" on public.vitrix_user_roles;
create policy "Vitrix insert user roles"
  on public.vitrix_user_roles for insert
  to authenticated
  with check (
    public.vitrix_has_permission('users.manage')
    and (
      public.vitrix_is_superadmin()
      or not exists (
        select 1
        from public.vitrix_roles r
        where r.id = role_id
          and r.name = 'superadmin'
      )
    )
  );

drop policy if exists "Vitrix update user roles" on public.vitrix_user_roles;
create policy "Vitrix update user roles"
  on public.vitrix_user_roles for update
  to authenticated
  using (
    public.vitrix_has_permission('users.manage')
    and (
      public.vitrix_is_superadmin()
      or not exists (
        select 1
        from public.vitrix_roles r
        where r.id = role_id
          and r.name = 'superadmin'
      )
    )
  )
  with check (
    public.vitrix_has_permission('users.manage')
    and (
      public.vitrix_is_superadmin()
      or not exists (
        select 1
        from public.vitrix_roles r
        where r.id = role_id
          and r.name = 'superadmin'
      )
    )
  );

drop policy if exists "Vitrix delete user roles" on public.vitrix_user_roles;
create policy "Vitrix delete user roles"
  on public.vitrix_user_roles for delete
  to authenticated
  using (
    public.vitrix_has_permission('users.manage')
    and (
      public.vitrix_is_superadmin()
      or not exists (
        select 1
        from public.vitrix_roles r
        where r.id = role_id
          and r.name = 'superadmin'
      )
    )
  );

insert into public.vitrix_roles (name, label)
values ('superadmin', 'Superadmin Chimera')
on conflict (name) do update set label = excluded.label;

insert into public.vitrix_permissions (key, label)
values
  ('vitrix.superadmin', 'Accesso superadmin Chimera'),
  ('license.manage', 'Gestione licenze Vitrix'),
  ('clients.manage', 'Gestione clienti Chimera')
on conflict (key) do update set label = excluded.label;

insert into public.vitrix_role_permissions (role_id, permission_id)
select r.id, p.id
from public.vitrix_roles r
cross join public.vitrix_permissions p
where r.name = 'superadmin'
on conflict do nothing;
