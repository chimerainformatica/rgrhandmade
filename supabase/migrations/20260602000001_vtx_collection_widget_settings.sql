-- VTX Collection widget settings.
-- Keeps ctx_collections as a legacy key, but seeds the new canonical widget_id.

INSERT INTO vitrix_widget_settings (widget_id, config)
SELECT
  'vtx_collection',
  COALESCE(
    (SELECT config FROM vitrix_widget_settings WHERE widget_id = 'ctx_collections'),
    '{
      "enabled": true,
      "eyebrow": {"it": "Le collezioni", "en": "Collections"},
      "title_pre": {"it": "Linee uniche,", "en": "Unique lines,"},
      "title_em": {"it": "filo avvolto su sagoma.", "en": "wire wrapped on mold."},
      "lede": {"it": "Sedici collezioni capsule pensate per esaltare la lavorazione a filo, la trama del metallo e la luce delle pietre.", "en": "Sixteen capsule collections designed to enhance wire work, the texture of metal and the light of stones."},
      "show_filters": true,
      "visible_categories": ["Anelli", "Bracciali", "Collane", "Orecchini"],
      "default_tab": 0,
      "items_limit": 0,
      "show_ref_badge": true,
      "show_cta": true,
      "cta_label": {"it": "Tutte le collezioni", "en": "All collections"}
    }'::jsonb
  )
ON CONFLICT (widget_id) DO UPDATE
SET
  config = EXCLUDED.config,
  updated_at = now();
