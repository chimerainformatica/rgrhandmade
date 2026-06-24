-- RGR catalogue widget default: no tab navigation on the public frontend.
-- The widget keeps the switch available in Vitrix, but this site starts with tabs disabled.

update public.vitrix_widget_settings
set
  config = jsonb_set(
    jsonb_set(coalesce(config, '{}'::jsonb), '{show_filters}', 'false'::jsonb, true),
    '{default_tab}',
    '0'::jsonb,
    true
  ),
  updated_at = now()
where widget_id in ('vtx_catalogue', 'ctx_catalogue');
