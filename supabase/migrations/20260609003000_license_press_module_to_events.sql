update public.vitrix_license_state
set
  enabled_modules = array_replace(enabled_modules, 'press', 'events'),
  updated_at = now()
where 'press' = any(enabled_modules);
