-- CTX Widget Settings
-- Tabella generica per la configurazione dei widget Chimera (CTX).
-- Ogni widget ha una row identificata da widget_id con config JSONB libero.

CREATE TABLE IF NOT EXISTS vitrix_widget_settings (
  widget_id  text PRIMARY KEY,
  config     jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- RLS: lettura pubblica, scrittura solo via service role (bypass RLS)
ALTER TABLE vitrix_widget_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read widget settings"
  ON vitrix_widget_settings
  FOR SELECT
  USING (true);

-- Seed default per CTX Collections
INSERT INTO vitrix_widget_settings (widget_id, config) VALUES (
  'ctx_collections',
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
  }'
) ON CONFLICT (widget_id) DO NOTHING;
