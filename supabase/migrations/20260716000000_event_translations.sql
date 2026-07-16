-- Collega le varianti linguistiche IT/EN degli eventi e mantiene sincronizzati
-- i campi strutturali condivisi tra le varianti dello stesso contenuto.

alter table public.news
  add column if not exists translation_group_id uuid;

update public.news
set translation_group_id = gen_random_uuid()
where translation_group_id is null;

alter table public.news
  alter column translation_group_id set default gen_random_uuid(),
  alter column translation_group_id set not null;

alter table public.news drop constraint if exists news_lang_check;
alter table public.news
  add constraint news_lang_check check (lang in ('it', 'en'));

create unique index if not exists news_translation_group_lang_unique
  on public.news (translation_group_id, lang);

create index if not exists news_translation_group_idx
  on public.news (translation_group_id);

create or replace function public.sync_news_translation_shared_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  update public.news
  set
    type = new.type,
    event_start_at = new.event_start_at,
    event_end_at = new.event_end_at,
    main_image_path = new.main_image_path,
    main_image_url = new.main_image_url,
    cover_image = new.cover_image,
    og_image_path = new.og_image_path,
    og_image_url = new.og_image_url,
    image_position = new.image_position,
    is_featured = new.is_featured,
    sort_order = new.sort_order,
    widget_id = new.widget_id,
    cta_url = new.cta_url,
    cta_target = new.cta_target,
    event_date = case when new.type = 'publication' then new.event_date else event_date end,
    event_date_label = case when new.type = 'publication' then new.event_date_label else event_date_label end,
    updated_at = now()
  where translation_group_id = new.translation_group_id
    and id <> new.id;

  return new;
end;
$$;

drop trigger if exists news_translation_shared_fields_trigger on public.news;
create trigger news_translation_shared_fields_trigger
after update of
  type,
  event_start_at,
  event_end_at,
  main_image_path,
  main_image_url,
  cover_image,
  og_image_path,
  og_image_url,
  image_position,
  is_featured,
  sort_order,
  widget_id,
  cta_url,
  cta_target,
  event_date,
  event_date_label
on public.news
for each row
execute function public.sync_news_translation_shared_fields();

comment on column public.news.translation_group_id is
  'Identificatore condiviso dalle varianti linguistiche dello stesso evento o pubblicazione.';
