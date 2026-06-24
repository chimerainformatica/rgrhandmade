-- Elimina le tabelle Vitrix create con schema errato da initial_schema
-- così vitrix_core.sql le ricrea con UUID e updated_at corretti.

drop table if exists public.vitrix_role_permissions cascade;
drop table if exists public.vitrix_user_roles cascade;
drop table if exists public.vitrix_permissions cascade;
drop table if exists public.vitrix_roles cascade;
drop table if exists public.vitrix_modules cascade;
