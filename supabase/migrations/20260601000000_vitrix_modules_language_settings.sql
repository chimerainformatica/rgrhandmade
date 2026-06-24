-- Ripara configurazione produzione per moduli Vitrix e lingua landing.

alter table public.vitrix_site_settings
  add column if not exists default_language text not null default 'it';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vitrix_site_settings_default_language_check'
  ) then
    alter table public.vitrix_site_settings
      add constraint vitrix_site_settings_default_language_check
      check (default_language in ('it', 'en'));
  end if;
end $$;

insert into public.vitrix_modules (id, label, description, enabled, sort_order)
values
  ('dashboard', 'Dashboard', 'Panoramica del sito e stato connessione.', true, 0),
  ('collections', 'Collections', 'Gestione collezioni pubbliche della landing.', true, 1),
  ('press', 'Press & Fiere', 'Gestione delle presenze a fiere e press.', true, 2),
  ('media', 'Media', 'Gestione file e immagini.', false, 3),
  ('settings', 'Impostazioni', 'Configurazione del sito, lingua e moduli.', true, 4)
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.vitrix_permissions (key, label)
values
  ('vitrix.read', 'Accesso al pannello Vitrix'),
  ('vitrix.settings.manage', 'Gestione impostazioni e moduli'),
  ('vitrix.collections.write', 'Gestione collezioni landing'),
  ('vitrix.press.write', 'Gestione press e fiere'),
  ('users.manage', 'Gestione utenti, ruoli e permessi')
on conflict (key) do update set label = excluded.label;

insert into public.vitrix_role_permissions (role_id, permission_id)
select r.id, p.id
from public.vitrix_roles r
cross join public.vitrix_permissions p
where r.name in ('superadmin', 'owner')
on conflict do nothing;

insert into public.vitrix_role_permissions (role_id, permission_id)
select r.id, p.id
from public.vitrix_roles r
join public.vitrix_permissions p on p.key in (
  'vitrix.read',
  'vitrix.settings.manage',
  'vitrix.collections.write',
  'vitrix.press.write',
  'users.manage'
)
where r.name = 'admin'
on conflict do nothing;

insert into public.vitrix_role_permissions (role_id, permission_id)
select r.id, p.id
from public.vitrix_roles r
join public.vitrix_permissions p on p.key in ('vitrix.read', 'vitrix.collections.write', 'vitrix.press.write')
where r.name = 'editor'
on conflict do nothing;
