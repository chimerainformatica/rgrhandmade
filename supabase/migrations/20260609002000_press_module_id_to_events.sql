insert into public.vitrix_modules (id, label, description, enabled, sort_order)
select
  'events',
  'Eventi',
  'Gestione eventi, fiere, press e contenuti editoriali.',
  enabled,
  sort_order
from public.vitrix_modules
where id = 'press'
on conflict (id) do update
set
  label = excluded.label,
  description = excluded.description,
  enabled = excluded.enabled,
  sort_order = excluded.sort_order;

delete from public.vitrix_modules
where id = 'press';
