begin;

-- Catalogue translations use an explicit group instead of relying on ref,
-- which is a business reference and is not guaranteed to be unique forever.
alter table public.catalogue
  add column if not exists translation_group_id uuid,
  add column if not exists parent_translation_group_id uuid;

update public.catalogue
set translation_group_id = gen_random_uuid()
where translation_group_id is null;

alter table public.catalogue
  alter column translation_group_id set default gen_random_uuid(),
  alter column translation_group_id set not null;

alter table public.catalogue drop constraint if exists catalogue_lang_check;
alter table public.catalogue
  add constraint catalogue_lang_check check (lang in ('it', 'en'));

create unique index if not exists catalogue_translation_group_lang_unique
  on public.catalogue (translation_group_id, lang);
create index if not exists catalogue_translation_group_idx
  on public.catalogue (translation_group_id);
create index if not exists catalogue_parent_translation_group_idx
  on public.catalogue (parent_translation_group_id);

update public.catalogue child
set parent_translation_group_id = parent.translation_group_id
from public.catalogue parent
where parent.id = coalesce(child.parent_id, child.parure_id)
  and child.parent_translation_group_id is null;

-- Every current logical item receives the missing language as a draft.
insert into public.catalogue (
  ref, title, description, category, img_path, img_position, lang, status,
  sort_order, item_type, parent_id, parure_id, translation_group_id,
  parent_translation_group_id, created_at
)
select
  source.ref, source.title, source.description, source.category,
  source.img_path, source.img_position,
  case source.lang when 'it' then 'en' else 'it' end,
  'draft', source.sort_order, source.item_type, null, null,
  source.translation_group_id, source.parent_translation_group_id, now()
from public.catalogue source
where not exists (
  select 1
  from public.catalogue sibling
  where sibling.translation_group_id = source.translation_group_id
    and sibling.lang <> source.lang
);

-- Reconnect every translated child to the parent variant in the same language.
update public.catalogue child
set
  parent_id = parent.id,
  parure_id = parent.id
from public.catalogue parent
where child.parent_translation_group_id is not null
  and parent.translation_group_id = child.parent_translation_group_id
  and parent.lang = child.lang
  and child.item_type = 'item';

alter table public.catalogue_categories
  add column if not exists name_en text;

update public.catalogue_categories
set name_en = case lower(name)
  when 'anelli' then 'Rings'
  when 'bracciali' then 'Bracelets'
  when 'collane' then 'Necklaces'
  when 'orecchini' then 'Earrings'
  when 'parure' then 'Sets'
  when 'collection' then 'Collections'
  else name
end
where name_en is null or btrim(name_en) = '';

-- Existing Events/Publications also receive their EN draft immediately.
insert into public.news (
  category, venue, title, event_date, type, lang, status, description, slug,
  cover_image, body, excerpt, content, tags, event_start_at, event_end_at,
  event_date_label, main_image_path, main_image_url, og_image_path,
  og_image_url, image_alt, image_position, cta_label, cta_url, cta_target,
  is_featured, sort_order, widget_id, seo_title, seo_description,
  canonical_url, robots_index, robots_follow, published_at,
  translation_group_id, publication_date
)
select
  source.category, source.venue, source.title, source.event_date, source.type,
  case source.lang when 'it' then 'en' else 'it' end,
  'draft', source.description, source.slug, source.cover_image, source.body,
  source.excerpt, source.content, source.tags, source.event_start_at,
  source.event_end_at, source.event_date_label, source.main_image_path,
  source.main_image_url, source.og_image_path, source.og_image_url,
  source.image_alt, source.image_position, source.cta_label, source.cta_url,
  source.cta_target, source.is_featured, source.sort_order, source.widget_id,
  source.seo_title, source.seo_description, source.canonical_url,
  source.robots_index, source.robots_follow, null,
  source.translation_group_id, source.publication_date
from public.news source
where not exists (
  select 1 from public.news sibling
  where sibling.translation_group_id = source.translation_group_id
    and sibling.lang <> source.lang
);

-- Keep catalogue presentation and relationships aligned, without overwriting
-- language-specific title, description or publication status.
create or replace function public.sync_catalogue_translation_shared_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_parent_id bigint;
begin
  if pg_trigger_depth() > 1 then return new; end if;

  if new.parent_translation_group_id is not null then
    select id into resolved_parent_id
    from public.catalogue
    where translation_group_id = new.parent_translation_group_id
      and lang <> new.lang
    limit 1;
  end if;

  update public.catalogue sibling
  set
    ref = new.ref,
    category = new.category,
    img_path = new.img_path,
    img_position = new.img_position,
    sort_order = new.sort_order,
    item_type = new.item_type,
    parent_translation_group_id = new.parent_translation_group_id,
    parent_id = case when new.item_type = 'item' then resolved_parent_id else null end,
    parure_id = case when new.item_type = 'item' then resolved_parent_id else null end
  where sibling.translation_group_id = new.translation_group_id
    and sibling.id <> new.id;
  return new;
end;
$$;

drop trigger if exists catalogue_translation_shared_fields_trigger on public.catalogue;
create trigger catalogue_translation_shared_fields_trigger
after insert or update of ref, category, img_path, img_position, sort_order,
  item_type, parent_translation_group_id
on public.catalogue
for each row execute function public.sync_catalogue_translation_shared_fields();

commit;
