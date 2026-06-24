-- Licenza attiva per sviluppo — tutti i moduli abilitati.
-- Sostituire con la verifica remota Chimera quando l'API sarà configurata.

insert into public.vitrix_license_state (site_id, status, plan, enabled_modules, last_checked_at)
values (
  'rgrhandmade',
  'active',
  'pro',
  array['dashboard', 'collections', 'press', 'media', 'settings'],
  now()
)
on conflict (site_id) do update set
  status          = 'active',
  plan            = 'pro',
  enabled_modules = array['dashboard', 'collections', 'press', 'media', 'settings'],
  last_checked_at = now(),
  updated_at      = now();
