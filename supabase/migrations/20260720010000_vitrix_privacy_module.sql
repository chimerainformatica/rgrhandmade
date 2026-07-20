create table if not exists public.vitrix_privacy_settings (
  id text primary key default 'default',
  config_schema_version smallint not null default 2 check (config_schema_version = 2),
  draft_config jsonb not null default '{}'::jsonb check (jsonb_typeof(draft_config) = 'object'),
  published_config jsonb not null default '{}'::jsonb check (jsonb_typeof(published_config) = 'object'),
  published_revision integer not null default 1 check (published_revision > 0),
  consent_version integer not null default 1 check (consent_version > 0),
  published_at timestamptz,
  published_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.vitrix_privacy_versions (
  id uuid primary key default gen_random_uuid(),
  revision integer not null unique,
  consent_version integer not null,
  config jsonb not null check (jsonb_typeof(config) = 'object'),
  requires_renewal boolean not null default false,
  published_at timestamptz not null default now(),
  published_by uuid references auth.users(id) on delete set null
);

create table if not exists public.privacy_consent_receipts (
  receipt_id uuid primary key,
  policy_version integer not null,
  choices jsonb not null check (jsonb_typeof(choices) = 'object'),
  consented_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  delete_after timestamptz not null
);

create index if not exists privacy_consent_receipts_delete_after_idx on public.privacy_consent_receipts(delete_after);
create index if not exists vitrix_privacy_versions_published_at_idx on public.vitrix_privacy_versions(published_at desc);
create index if not exists privacy_consent_receipts_policy_version_idx on public.privacy_consent_receipts(policy_version);

alter table public.vitrix_privacy_settings enable row level security;
alter table public.vitrix_privacy_versions enable row level security;
alter table public.privacy_consent_receipts enable row level security;

revoke all on table public.vitrix_privacy_settings from anon, authenticated;
revoke all on table public.vitrix_privacy_versions from anon, authenticated;
revoke all on table public.privacy_consent_receipts from anon, authenticated;

insert into public.vitrix_privacy_settings (id) values ('default') on conflict (id) do nothing;

insert into public.vitrix_modules (id, label, description, enabled, sort_order)
values ('privacy', 'Privacy & Cookie', 'Gestione informative, preferenze cookie e consensi.', true, 20)
on conflict (id) do update set label = excluded.label, description = excluded.description, sort_order = excluded.sort_order;

insert into public.vitrix_permissions (key, label)
values ('vitrix.privacy.manage', 'Gestione privacy, cookie e consensi')
on conflict (key) do update set label = excluded.label;

insert into public.vitrix_role_permissions (role_id, permission_id)
select r.id, p.id
from public.vitrix_roles r
join public.vitrix_permissions p on p.key = 'vitrix.privacy.manage'
where r.name in ('superadmin', 'owner', 'admin')
on conflict do nothing;
