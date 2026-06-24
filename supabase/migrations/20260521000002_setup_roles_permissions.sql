-- Setup base roles and permissions for Vitrix

-- Insert base roles
insert into public.vitrix_roles (name, label)
values
  ('owner', 'Proprietario'),
  ('admin', 'Amministratore'),
  ('editor', 'Editor'),
  ('viewer', 'Visualizzatore')
on conflict (name) do update set label = excluded.label;

-- Insert permissions for modules
insert into public.vitrix_permissions (key, label)
values
  ('vitrix.read', 'Accesso al pannello Vitrix'),
  ('vitrix.gallery.write', 'Gestione gallery (upload, modifica, eliminazione)'),
  ('vitrix.collections.write', 'Gestione collezioni'),
  ('vitrix.press.write', 'Gestione press'),
  ('users.manage', 'Gestione utenti'),
  ('license.manage', 'Gestione licenze')
on conflict (key) do nothing;

-- Assign permissions to roles
-- Editor gets: vitrix.read, vitrix.gallery.write, vitrix.collections.write, vitrix.press.write
insert into public.vitrix_role_permissions (role_id, permission_id)
select r.id, p.id
from public.vitrix_roles r
cross join public.vitrix_permissions p
where r.name = 'editor'
  and p.key in ('vitrix.read', 'vitrix.gallery.write', 'vitrix.collections.write', 'vitrix.press.write')
on conflict do nothing;

-- Admin gets all except license.manage
insert into public.vitrix_role_permissions (role_id, permission_id)
select r.id, p.id
from public.vitrix_roles r
cross join public.vitrix_permissions p
where r.name = 'admin'
  and p.key != 'license.manage'
on conflict do nothing;

-- Owner gets all permissions
insert into public.vitrix_role_permissions (role_id, permission_id)
select r.id, p.id
from public.vitrix_roles r
cross join public.vitrix_permissions p
where r.name = 'owner'
on conflict do nothing;

-- Viewer gets only vitrix.read
insert into public.vitrix_role_permissions (role_id, permission_id)
select r.id, p.id
from public.vitrix_roles r
cross join public.vitrix_permissions p
where r.name = 'viewer'
  and p.key = 'vitrix.read'
on conflict do nothing;
