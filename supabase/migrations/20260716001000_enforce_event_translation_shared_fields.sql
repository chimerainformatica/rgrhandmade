-- Impedisce che una variante appena inserita diverga dai campi strutturali
-- del gruppo, anche quando l'inserimento non passa dall'interfaccia Vitrix.

create or replace function public.align_news_translation_shared_fields_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  source public.news%rowtype;
begin
  select * into source
  from public.news
  where translation_group_id = new.translation_group_id
  order by case when lang = 'it' then 0 else 1 end, id
  limit 1;

  if not found then
    return new;
  end if;

  new.type := source.type;
  new.event_start_at := source.event_start_at;
  new.event_end_at := source.event_end_at;
  new.main_image_path := source.main_image_path;
  new.main_image_url := source.main_image_url;
  new.cover_image := source.cover_image;
  new.og_image_path := source.og_image_path;
  new.og_image_url := source.og_image_url;
  new.image_position := source.image_position;
  new.is_featured := source.is_featured;
  new.sort_order := source.sort_order;
  new.widget_id := source.widget_id;
  new.cta_url := source.cta_url;
  new.cta_target := source.cta_target;

  if source.type = 'publication' then
    new.category := 'Pubblicazioni';
    new.event_date := source.event_date;
    new.event_date_label := source.event_date_label;
  end if;

  return new;
end;
$$;

drop trigger if exists news_translation_shared_fields_insert_trigger on public.news;
create trigger news_translation_shared_fields_insert_trigger
before insert on public.news
for each row
execute function public.align_news_translation_shared_fields_on_insert();

create or replace function public.sync_publication_translation_category()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type = 'publication' then
    update public.news
    set category = 'Pubblicazioni', updated_at = now()
    where translation_group_id = new.translation_group_id
      and id <> new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists news_translation_publication_category_trigger on public.news;
create trigger news_translation_publication_category_trigger
after update of type on public.news
for each row
execute function public.sync_publication_translation_category();
