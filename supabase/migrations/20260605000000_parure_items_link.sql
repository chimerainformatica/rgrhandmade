-- Parure items linking: allows items (non-Parure) to be linked to a Parure
-- This enables creating composite Parure sets by grouping existing items

alter table public.catalogue
add column if not exists parure_id bigint references public.catalogue(id) on delete set null;

-- Index for efficient filtering of items by parure
create index if not exists catalogue_parure_id_idx on public.catalogue (parure_id);

-- Constraint: only items where category != 'Parure' can have a parure_id
alter table public.catalogue
drop constraint if exists parure_only_non_parure_items;

alter table public.catalogue
add constraint parure_only_non_parure_items
  check (
    (category = 'Parure' and parure_id is null) or
    (category != 'Parure')
  );

-- Comment for clarity
comment on column public.catalogue.parure_id is 'Foreign key to a Parure item (when category=Parure). Non-Parure items can reference a Parure to indicate they are part of that set.';
