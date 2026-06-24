-- Rename collections table to catalogue
-- This migration renames the public.collections table to catalogue and updates all related identifiers

-- 1. Rename the main table
ALTER TABLE public.collections RENAME TO catalogue;

-- 2. Update vitrix_modules (module registry)
UPDATE public.vitrix_modules SET id = 'catalogue' WHERE id = 'collections';

-- 3. Update enabled_modules array in license (replace 'collections' with 'catalogue')
UPDATE public.vitrix_license_state
SET enabled_modules = array_replace(enabled_modules, 'collections', 'catalogue');

-- 4. Update permission keys in vitrix_permissions (via FK relations)
UPDATE public.vitrix_permissions
SET key = replace(key, 'vitrix.collections.', 'vitrix.catalogue.')
WHERE key LIKE 'vitrix.collections.%';

-- 5. Update widget_id values in vitrix_widget_settings
UPDATE public.vitrix_widget_settings
SET widget_id = 'vtx_catalogue'
WHERE widget_id = 'vtx_collection';

UPDATE public.vitrix_widget_settings
SET widget_id = 'ctx_catalogue'
WHERE widget_id = 'ctx_collections';
