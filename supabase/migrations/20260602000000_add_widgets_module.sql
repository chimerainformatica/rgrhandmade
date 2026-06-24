-- Aggiunge il modulo Widgets alla tabella vitrix_modules
INSERT INTO vitrix_modules (id, label, description, enabled, sort_order)
VALUES (
  'widgets',
  'Widgets',
  'Configura le sezioni della homepage (VTX Collection, ecc.)',
  true,
  10
) ON CONFLICT (id) DO UPDATE
  SET label       = EXCLUDED.label,
      description = EXCLUDED.description,
      enabled     = EXCLUDED.enabled;
