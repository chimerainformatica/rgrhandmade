-- vtx-collection: tabelle media_collections + media_collection_items
-- Sostituisce il modulo vtx-gallery

-- ── 1. Tabella collezioni ─────────────────────────────────────────
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

-- ── 2. Tabella items ──────────────────────────────────────────────
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

-- ── 3. RLS ────────────────────────────────────────────────────────
alter table public.media_collections      enable row level security;
alter table public.media_collection_items enable row level security;

-- Collections: lettura pubblica dei published (frontend)
drop policy if exists "Media collections public read" on public.media_collections;
create policy "Media collections public read"
  on public.media_collections for select
  using (status = 'published');

-- Collections: vitrix legge tutto (inclusi draft)
drop policy if exists "Media collections vitrix read all" on public.media_collections;
create policy "Media collections vitrix read all"
  on public.media_collections for select
  to authenticated
  using (public.vitrix_has_permission('vitrix.read'));

-- Collections: scrittura richide permesso
drop policy if exists "Media collections write" on public.media_collections;
create policy "Media collections write"
  on public.media_collections for all
  to authenticated
  using  (public.vitrix_has_permission('vitrix.collections.write'))
  with check (public.vitrix_has_permission('vitrix.collections.write'));

-- Items: lettura pubblica dei published
drop policy if exists "Media items public read" on public.media_collection_items;
create policy "Media items public read"
  on public.media_collection_items for select
  using (status = 'published');

-- Items: vitrix legge tutto
drop policy if exists "Media items vitrix read all" on public.media_collection_items;
create policy "Media items vitrix read all"
  on public.media_collection_items for select
  to authenticated
  using (public.vitrix_has_permission('vitrix.read'));

-- Items: scrittura richiede permesso
drop policy if exists "Media items write" on public.media_collection_items;
create policy "Media items write"
  on public.media_collection_items for all
  to authenticated
  using  (public.vitrix_has_permission('vitrix.collections.write'))
  with check (public.vitrix_has_permission('vitrix.collections.write'));

-- ── 4. Permessi ───────────────────────────────────────────────────
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

-- ── 5. Modulo vitrix ──────────────────────────────────────────────
insert into public.vitrix_modules (id, label, description, enabled, sort_order)
values ('collections', 'Collections', 'Gestione media collections e immagini.', true, 1)
on conflict (id) do update set
  label       = 'Collections',
  description = 'Gestione media collections e immagini.',
  enabled     = true,
  updated_at  = now();

-- Rimuovi il modulo gallery (ora obsoleto)
delete from public.vitrix_modules where id = 'gallery';

-- ── 6. Migrazione dati da gallery_images (solo se la tabella esiste) ─
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'gallery_images'
  ) then
    -- Crea collection di default per i dati esistenti
    insert into public.media_collections (id, name, slug, description, sort_order, status)
    values (
      'a0000000-0000-0000-0000-000000000001'::uuid,
      'Gallery',
      'gallery',
      'Galleria immagini principale.',
      0,
      'published'
    )
    on conflict (slug) do nothing;

    -- Migra gallery_images → media_collection_items
    insert into public.media_collection_items (
      id, collection_id, title, description, alt_text, tags, category,
      status, published_at, slug, storage_path, url,
      width, height, size_bytes, sort_order, created_at, updated_at
    )
    select
      gi.id,
      'a0000000-0000-0000-0000-000000000001'::uuid,
      gi.title,
      null,
      gi.alt_text,
      '{}',
      gi.category,
      case when gi.status = 'active' then 'published' else 'draft' end,
      gi.created_at,
      coalesce(
        nullif(
          lower(regexp_replace(regexp_replace(gi.title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g')),
          ''
        ),
        'item'
      ) || '-' || substr(gi.id::text, 1, 8),
      gi.storage_path,
      gi.url,
      gi.width,
      gi.height,
      gi.size_bytes,
      gi.sort_order,
      gi.created_at,
      gi.updated_at
    from public.gallery_images gi
    on conflict (collection_id, slug) do nothing;
  end if;
end $$;
