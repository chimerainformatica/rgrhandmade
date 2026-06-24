-- ============================================================================
-- VTX Events — estensione tabella `news` + categorie eventi (stile WordPress)
-- ----------------------------------------------------------------------------
-- 1. Nuovi campi editoriali su public.news: slug (URL SEO), cover_image, body,
--    description (excerpt). Backfill slug dalle righe esistenti.
-- 2. Tabella public.event_categories: categorie create dall'utente a cui
--    attribuire gli articoli per nome (campo news.category), rispecchia il
--    pattern di public.catalogue_categories.
-- ============================================================================

-- ---- 1. Campi editoriali su news ------------------------------------------
alter table public.news
  add column if not exists slug        text,
  add column if not exists cover_image text,
  add column if not exists body        text,
  add column if not exists description text,
  add column if not exists excerpt text,
  add column if not exists content text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists event_start_at timestamptz,
  add column if not exists event_end_at timestamptz,
  add column if not exists event_date_label text,
  add column if not exists main_image_path text,
  add column if not exists main_image_url text,
  add column if not exists og_image_path text,
  add column if not exists og_image_url text,
  add column if not exists image_alt text,
  add column if not exists image_position text default '50% 50%',
  add column if not exists cta_label text,
  add column if not exists cta_url text,
  add column if not exists cta_target text default '_self',
  add column if not exists is_featured boolean not null default false,
  add column if not exists sort_order integer not null default 0,
  add column if not exists widget_id text default 'vtx_events',
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists canonical_url text,
  add column if not exists robots_index boolean not null default true,
  add column if not exists robots_follow boolean not null default true,
  add column if not exists published_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.news drop constraint if exists news_type_check;
alter table public.news
  add constraint news_type_check check (type in ('event', 'fiera', 'press'));

-- Backfill slug per le righe esistenti (slugify del titolo + suffisso id per
-- garantire l'unicità). Le righe con accenti producono trattini: l'admin può
-- raffinare lo slug in seguito.
update public.news
set slug = trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')) || '-' || id
where slug is null or btrim(slug) = '';

drop index if exists news_slug_idx;

create unique index if not exists news_slug_lang_unique
  on public.news (slug, lang)
  where slug is not null;

create index if not exists news_widget_status_sort_idx
  on public.news (widget_id, status, sort_order, event_start_at);

update public.news
set
  excerpt = coalesce(nullif(excerpt, ''), nullif(description, ''), nullif(body, '')),
  content = coalesce(nullif(content, ''), nullif(body, '')),
  event_date_label = coalesce(nullif(event_date_label, ''), nullif(event_date, '')),
  main_image_url = coalesce(nullif(main_image_url, ''), nullif(cover_image, '')),
  widget_id = coalesce(nullif(widget_id, ''), 'vtx_events')
where true;

-- ---- 2. Categorie eventi ---------------------------------------------------
create table if not exists public.event_categories (
  id          uuid        primary key default gen_random_uuid(),
  events_key  text        not null default 'events',
  name        text        not null,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists event_categories_key_name_idx
  on public.event_categories (events_key, lower(name));

create index if not exists event_categories_key_order_idx
  on public.event_categories (events_key, sort_order);

alter table public.event_categories enable row level security;

drop policy if exists "Event categories vitrix read" on public.event_categories;
create policy "Event categories vitrix read"
  on public.event_categories for select
  to authenticated
  using (public.vitrix_has_permission('vitrix.read'));

drop policy if exists "Event categories write" on public.event_categories;
create policy "Event categories write"
  on public.event_categories for all
  to authenticated
  using (public.vitrix_has_permission('vitrix.press.write'))
  with check (public.vitrix_has_permission('vitrix.press.write'));

-- Lettura pubblica delle categorie (per i tab dinamici del widget frontend).
drop policy if exists "Event categories public read" on public.event_categories;
create policy "Event categories public read"
  on public.event_categories for select
  to anon
  using (true);

-- Seed dalle categorie già presenti nelle righe news.
insert into public.event_categories (events_key, name, sort_order)
select
  'events',
  src.name,
  row_number() over (order by src.name) - 1
from (
  select category as name
  from public.news
  where category is not null and btrim(category) <> ''
  group by category
) as src
on conflict do nothing;

insert into public.vitrix_widget_settings (widget_id, config)
values ('vtx_events', '{
  "enabled": true,
  "name": "Eventi homepage",
  "section_id": "news",
  "position": 50,
  "title": {"it":"News & Fiere","en":"Press & Fairs"},
  "description": {"it":"Eventi, fiere e pubblicazioni RGR.","en":"RGR events, fairs and press."},
  "layout": "featured-grid",
  "items_limit": 6,
  "sort": "featured_then_date_desc",
  "show_filters": true,
  "featured_first": true
}'::jsonb)
on conflict (widget_id) do nothing;
