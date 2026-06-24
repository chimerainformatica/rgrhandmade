create extension if not exists "pgcrypto";

create table if not exists public.vitrix_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  domain text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vitrix_modules (
  id text primary key,
  label text not null,
  description text not null default '',
  enabled boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vitrix_collections (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  title text not null,
  category text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  cover_image text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vitrix_press_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('fiera', 'press')),
  venue text,
  event_date text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vitrix_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name in ('owner', 'admin', 'editor', 'viewer')),
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.vitrix_permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.vitrix_role_permissions (
  role_id uuid not null references public.vitrix_roles(id) on delete cascade,
  permission_id uuid not null references public.vitrix_permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.vitrix_user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.vitrix_roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create or replace function public.vitrix_has_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.vitrix_user_roles ur
    join public.vitrix_role_permissions rp on rp.role_id = ur.role_id
    join public.vitrix_permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and p.key = permission_key
  );
$$;

revoke all on function public.vitrix_has_permission(text) from public;
grant execute on function public.vitrix_has_permission(text) to authenticated;

alter table public.vitrix_projects enable row level security;
alter table public.vitrix_modules enable row level security;
alter table public.vitrix_collections enable row level security;
alter table public.vitrix_press_items enable row level security;
alter table public.vitrix_roles enable row level security;
alter table public.vitrix_permissions enable row level security;
alter table public.vitrix_role_permissions enable row level security;
alter table public.vitrix_user_roles enable row level security;

drop policy if exists "Public enabled modules read" on public.vitrix_modules;
create policy "Public enabled modules read"
  on public.vitrix_modules for select
  using (enabled = true);

drop policy if exists "Public published collections read" on public.vitrix_collections;
create policy "Public published collections read"
  on public.vitrix_collections for select
  using (status = 'published');

drop policy if exists "Public published press read" on public.vitrix_press_items;
create policy "Public published press read"
  on public.vitrix_press_items for select
  using (status = 'published');

drop policy if exists "Vitrix read projects" on public.vitrix_projects;
create policy "Vitrix read projects"
  on public.vitrix_projects for select
  to authenticated
  using (public.vitrix_has_permission('vitrix.read'));

drop policy if exists "Vitrix manage projects" on public.vitrix_projects;
create policy "Vitrix manage projects"
  on public.vitrix_projects for all
  to authenticated
  using (public.vitrix_has_permission('vitrix.settings.manage'))
  with check (public.vitrix_has_permission('vitrix.settings.manage'));

drop policy if exists "Vitrix read modules" on public.vitrix_modules;
create policy "Vitrix read modules"
  on public.vitrix_modules for select
  to authenticated
  using (public.vitrix_has_permission('vitrix.read'));

drop policy if exists "Vitrix manage modules" on public.vitrix_modules;
create policy "Vitrix manage modules"
  on public.vitrix_modules for all
  to authenticated
  using (public.vitrix_has_permission('vitrix.settings.manage'))
  with check (public.vitrix_has_permission('vitrix.settings.manage'));

drop policy if exists "Vitrix read roles" on public.vitrix_roles;
create policy "Vitrix read roles"
  on public.vitrix_roles for select
  to authenticated
  using (public.vitrix_has_permission('users.manage'));

drop policy if exists "Vitrix read permissions" on public.vitrix_permissions;
create policy "Vitrix read permissions"
  on public.vitrix_permissions for select
  to authenticated
  using (public.vitrix_has_permission('users.manage'));

drop policy if exists "Vitrix read role permissions" on public.vitrix_role_permissions;
create policy "Vitrix read role permissions"
  on public.vitrix_role_permissions for select
  to authenticated
  using (public.vitrix_has_permission('users.manage'));

drop policy if exists "Vitrix manage user roles" on public.vitrix_user_roles;
create policy "Vitrix manage user roles"
  on public.vitrix_user_roles for all
  to authenticated
  using (public.vitrix_has_permission('users.manage'))
  with check (public.vitrix_has_permission('users.manage'));

insert into public.vitrix_projects (slug, name, domain)
values ('rgrhandmade', 'R.G.R. Handmade', 'rgrhandmade.it')
on conflict (slug) do update set
  name = excluded.name,
  domain = excluded.domain,
  updated_at = now();

insert into public.vitrix_modules (id, label, description, enabled, sort_order)
values
  ('dashboard', 'Dashboard', 'Shell iniziale Vitrix pronta per login, sessione e moduli futuri.', true, 0)
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description,
  enabled = excluded.enabled,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.vitrix_roles (name, label)
values
  ('owner', 'Owner'),
  ('admin', 'Amministratore'),
  ('editor', 'Editor'),
  ('viewer', 'Viewer')
on conflict (name) do update set label = excluded.label;

insert into public.vitrix_permissions (key, label)
values
  ('vitrix.read', 'Accesso al pannello Vitrix'),
  ('vitrix.settings.manage', 'Gestione impostazioni e moduli'),
  ('users.manage', 'Gestione utenti, ruoli e permessi')
on conflict (key) do update set label = excluded.label;

insert into public.vitrix_role_permissions (role_id, permission_id)
select r.id, p.id
from public.vitrix_roles r
cross join public.vitrix_permissions p
where r.name = 'owner'
on conflict do nothing;

insert into public.vitrix_role_permissions (role_id, permission_id)
select r.id, p.id
from public.vitrix_roles r
join public.vitrix_permissions p on p.key in ('vitrix.read', 'vitrix.settings.manage')
where r.name = 'admin'
on conflict do nothing;

insert into public.vitrix_role_permissions (role_id, permission_id)
select r.id, p.id
from public.vitrix_roles r
join public.vitrix_permissions p on p.key = 'vitrix.read'
where r.name in ('editor', 'viewer')
on conflict do nothing;
