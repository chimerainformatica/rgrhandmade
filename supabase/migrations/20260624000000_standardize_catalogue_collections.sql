-- Standardize catalogue collections.
-- Keeps legacy parure_id for compatibility while introducing generic fields.

alter table public.catalogue
add column if not exists item_type text not null default 'item',
add column if not exists parent_id bigint references public.catalogue(id) on delete set null;

alter table public.catalogue
drop constraint if exists catalogue_item_type_check;

alter table public.catalogue
add constraint catalogue_item_type_check
  check (item_type in ('collection', 'item'));

create index if not exists catalogue_parent_id_idx on public.catalogue (parent_id);
create index if not exists catalogue_item_type_idx on public.catalogue (item_type);

alter table public.catalogue
drop constraint if exists parure_only_non_parure_items;

update public.catalogue
set item_type = 'collection'
where category = 'Parure';

update public.catalogue
set
  item_type = 'item',
  parent_id = parure_id
where parure_id is not null;

update public.catalogue
set item_type = 'item'
where item_type is null;

alter table public.catalogue
drop constraint if exists catalogue_collection_parent_check;

alter table public.catalogue
add constraint catalogue_collection_parent_check
  check (
    (item_type = 'collection' and parent_id is null) or
    (item_type = 'item')
  );

comment on column public.catalogue.item_type is 'Generic catalogue row type: collection container or individual item.';
comment on column public.catalogue.parent_id is 'Optional parent collection id for catalogue items. Replaces parure_id for new code.';
