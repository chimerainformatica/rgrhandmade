-- Data strutturata mese/anno per ordinare cronologicamente le pubblicazioni.

alter table public.news
  add column if not exists publication_date date;

update public.news
set publication_date = make_date(
  (regexp_match(coalesce(event_date_label, event_date, ''), '(20[0-9]{2})'))[1]::integer,
  case lower(left(btrim(coalesce(event_date_label, event_date, '')), 3))
    when 'gen' then 1 when 'jan' then 1
    when 'feb' then 2
    when 'mar' then 3
    when 'apr' then 4
    when 'mag' then 5 when 'may' then 5
    when 'giu' then 6 when 'jun' then 6
    when 'lug' then 7 when 'jul' then 7
    when 'ago' then 8 when 'aug' then 8
    when 'set' then 9 when 'sep' then 9
    when 'ott' then 10 when 'oct' then 10
    when 'nov' then 11
    when 'dic' then 12 when 'dec' then 12
    else 1
  end,
  1
)
where type = 'publication'
  and publication_date is null
  and coalesce(event_date_label, event_date, '') ~ '(20[0-9]{2})';

create index if not exists news_publication_date_idx
  on public.news (publication_date desc)
  where type = 'publication';

create or replace function public.sync_news_publication_date()
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
  set publication_date = new.publication_date, updated_at = now()
  where translation_group_id = new.translation_group_id
    and id <> new.id;
  return new;
end;
$$;

drop trigger if exists news_translation_publication_date_trigger on public.news;
create trigger news_translation_publication_date_trigger
after update of publication_date on public.news
for each row
execute function public.sync_news_publication_date();

create or replace function public.align_news_translation_publication_date_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  source_date date;
begin
  select publication_date into source_date
  from public.news
  where translation_group_id = new.translation_group_id
  order by case when lang = 'it' then 0 else 1 end, id
  limit 1;

  if found and new.type = 'publication' then
    new.publication_date := source_date;
  end if;
  return new;
end;
$$;

drop trigger if exists news_translation_publication_date_insert_trigger on public.news;
create trigger news_translation_publication_date_insert_trigger
before insert on public.news
for each row
execute function public.align_news_translation_publication_date_on_insert();

comment on column public.news.publication_date is
  'Mese/anno della pubblicazione, normalizzato al primo giorno del mese per l’ordinamento.';
