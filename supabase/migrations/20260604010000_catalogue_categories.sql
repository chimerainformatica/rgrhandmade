-- Catalogue categories for the admin Catalogo session.
-- Categories are stored separately from catalogue rows and can be reused by items.

create table if not exists public.catalogue_categories (
  id           uuid        primary key default gen_random_uuid(),
  catalogue_key text       not null default 'catalogue',
  name         text        not null,
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index if not exists catalogue_categories_key_name_idx
  on public.catalogue_categories (catalogue_key, lower(name));

create index if not exists catalogue_categories_key_order_idx
  on public.catalogue_categories (catalogue_key, sort_order);

alter table public.catalogue_categories enable row level security;

drop policy if exists "Catalogue categories vitrix read" on public.catalogue_categories;
create policy "Catalogue categories vitrix read"
  on public.catalogue_categories for select
  to authenticated
  using (public.vitrix_has_permission('vitrix.read'));

drop policy if exists "Catalogue categories write" on public.catalogue_categories;
create policy "Catalogue categories write"
  on public.catalogue_categories for all
  to authenticated
  using (public.vitrix_has_permission('vitrix.catalogue.write'))
  with check (public.vitrix_has_permission('vitrix.catalogue.write'));

insert into public.catalogue_categories (catalogue_key, name, sort_order)
select
  'catalogue',
  src.name,
  row_number() over (order by src.min_sort, src.name) - 1
from (
  select
    category as name,
    min(sort_order) as min_sort
  from public.catalogue
  where category is not null and btrim(category) <> ''
  group by category
) as src
on conflict do nothing;
