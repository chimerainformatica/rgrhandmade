-- Rinomina la sezione editoriale conservando le altre impostazioni del widget.

update public.vitrix_widget_settings
set
  config = coalesce(config, '{}'::jsonb) || jsonb_build_object(
    'publications',
    coalesce(config -> 'publications', '{}'::jsonb) || jsonb_build_object(
      'title', jsonb_build_object(
        'it', 'Editorial & Press',
        'en', 'Editorial & Press'
      )
    )
  ),
  updated_at = now()
where widget_id = 'vtx_events';
