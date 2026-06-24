-- ============================================================
-- VITRIX CMS — Migration da applicare nel Supabase Dashboard
-- Percorso: SQL Editor → Incolla e Esegui
-- ============================================================

-- ── 1. media_collections + media_collection_items ────────────
-- (dalla migration 20260522000000_vtx_collections.sql)

create table if not exists public.media_collections (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  slug         text        not null unique,
  description  text,
  cover_image_url text,
  sort_order   integer     not null default 0,
  status       text        not null default 'published'
                             check (status in ('published', 'draft')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists media_collections_slug_idx   on public.media_collections (slug);
create index if not exists media_collections_status_idx on public.media_collections (status);

create table if not exists public.media_collection_items (
  id             uuid        primary key default gen_random_uuid(),
  collection_id  uuid        not null references public.media_collections(id) on delete cascade,
  title          text        not null,
  description    text,
  alt_text       text,
  tags           text[]      not null default '{}',
  category       text,
  status         text        not null default 'published'
                               check (status in ('published', 'draft')),
  published_at   timestamptz,
  slug           text        not null,
  storage_path   text        not null,
  url            text        not null,
  width          integer,
  height         integer,
  size_bytes     integer,
  sort_order     integer     not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (collection_id, slug)
);

create index if not exists media_items_collection_idx  on public.media_collection_items (collection_id);
create index if not exists media_items_category_idx    on public.media_collection_items (category);
create index if not exists media_items_status_idx      on public.media_collection_items (status);
create index if not exists media_items_sort_order_idx  on public.media_collection_items (sort_order);

-- RLS
alter table public.media_collections      enable row level security;
alter table public.media_collection_items enable row level security;

drop policy if exists "Media collections public read" on public.media_collections;
create policy "Media collections public read"
  on public.media_collections for select
  using (status = 'published');

drop policy if exists "Media collections vitrix read all" on public.media_collections;
create policy "Media collections vitrix read all"
  on public.media_collections for select
  to authenticated
  using (public.vitrix_has_permission('vitrix.read'));

drop policy if exists "Media collections write" on public.media_collections;
create policy "Media collections write"
  on public.media_collections for all
  to authenticated
  using  (public.vitrix_has_permission('vitrix.collections.write'))
  with check (public.vitrix_has_permission('vitrix.collections.write'));

drop policy if exists "Media items public read" on public.media_collection_items;
create policy "Media items public read"
  on public.media_collection_items for select
  using (status = 'published');

drop policy if exists "Media items vitrix read all" on public.media_collection_items;
create policy "Media items vitrix read all"
  on public.media_collection_items for select
  to authenticated
  using (public.vitrix_has_permission('vitrix.read'));

drop policy if exists "Media items write" on public.media_collection_items;
create policy "Media items write"
  on public.media_collection_items for all
  to authenticated
  using  (public.vitrix_has_permission('vitrix.collections.write'))
  with check (public.vitrix_has_permission('vitrix.collections.write'));

insert into public.vitrix_permissions (key, label)
values ('vitrix.collections.write', 'Gestione media collections (upload, modifica, eliminazione)')
on conflict (key) do update set label = excluded.label;

insert into public.vitrix_role_permissions (role_id, permission_id)
select r.id, p.id
from   public.vitrix_roles r
cross join public.vitrix_permissions p
where  p.key = 'vitrix.collections.write'
  and  r.name in ('owner', 'admin', 'editor')
on conflict do nothing;

insert into public.vitrix_modules (id, label, description, enabled, sort_order)
values ('collections', 'Collections', 'Gestione media collections e immagini.', true, 1)
on conflict (id) do update set
  label       = 'Collections',
  description = 'Gestione media collections e immagini.',
  enabled     = true,
  updated_at  = now();

-- Rimuovi il modulo gallery (obsoleto)
delete from public.vitrix_modules where id = 'gallery';

-- ── 2. Permessi modulo press ──────────────────────────────────

insert into public.vitrix_permissions (key, label)
values ('vitrix.press.write', 'Gestione press e fiere (crea, modifica, elimina)')
on conflict (key) do update set label = excluded.label;

insert into public.vitrix_role_permissions (role_id, permission_id)
select r.id, p.id
from   public.vitrix_roles r
cross join public.vitrix_permissions p
where  p.key = 'vitrix.press.write'
  and  r.name in ('owner', 'admin', 'editor')
on conflict do nothing;

insert into public.vitrix_modules (id, label, description, enabled, sort_order)
values ('events', 'Eventi', 'Gestione eventi, fiere, press e contenuti editoriali.', true, 2)
on conflict (id) do update set
  label       = 'Eventi',
  description = 'Gestione eventi, fiere, press e contenuti editoriali.',
  enabled     = true,
  updated_at  = now();

-- ── 3. news: aggiungi colonne mancanti se non esistono ───────
alter table public.news
  add column if not exists description text,
  add column if not exists updated_at  timestamptz not null default now();

-- ── 4. Abilita modulo media ───────────────────────────────────
insert into public.vitrix_permissions (key, label)
values ('vitrix.media.write', 'Gestione media files (upload, eliminazione)')
on conflict (key) do update set label = excluded.label;

insert into public.vitrix_role_permissions (role_id, permission_id)
select r.id, p.id
from   public.vitrix_roles r
cross join public.vitrix_permissions p
where  p.key = 'vitrix.media.write'
  and  r.name in ('owner', 'admin', 'editor')
on conflict do nothing;

insert into public.vitrix_modules (id, label, description, enabled, sort_order)
values ('media', 'Media', 'Gestione file e asset del sito.', true, 3)
on conflict (id) do update set
  label       = 'Media',
  description = 'Gestione file e asset del sito.',
  enabled     = true,
  updated_at  = now();
