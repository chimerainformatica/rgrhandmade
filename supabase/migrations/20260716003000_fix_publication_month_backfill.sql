-- Corregge le edizioni in cui il mese non è all'inizio della label,
-- ad esempio "N. 236 · Apr./Mag. 2025".

update public.news
set publication_date = make_date(
  (regexp_match(coalesce(event_date_label, event_date, ''), '(20[0-9]{2})'))[1]::integer,
  case
    when lower(coalesce(event_date_label, event_date, '')) ~ '(gen|jan)' then 1
    when lower(coalesce(event_date_label, event_date, '')) ~ 'feb' then 2
    when lower(coalesce(event_date_label, event_date, '')) ~ 'mar' then 3
    when lower(coalesce(event_date_label, event_date, '')) ~ 'apr' then 4
    when lower(coalesce(event_date_label, event_date, '')) ~ '(mag|may)' then 5
    when lower(coalesce(event_date_label, event_date, '')) ~ '(giu|jun)' then 6
    when lower(coalesce(event_date_label, event_date, '')) ~ '(lug|jul)' then 7
    when lower(coalesce(event_date_label, event_date, '')) ~ '(ago|aug)' then 8
    when lower(coalesce(event_date_label, event_date, '')) ~ '(set|sep)' then 9
    when lower(coalesce(event_date_label, event_date, '')) ~ '(ott|oct)' then 10
    when lower(coalesce(event_date_label, event_date, '')) ~ 'nov' then 11
    when lower(coalesce(event_date_label, event_date, '')) ~ '(dic|dec)' then 12
    else extract(month from publication_date)::integer
  end,
  1
)
where type = 'publication'
  and publication_date is not null
  and coalesce(event_date_label, event_date, '') ~ '(20[0-9]{2})';

alter table public.news drop constraint if exists news_published_publication_date_check;
alter table public.news
  add constraint news_published_publication_date_check
  check (type <> 'publication' or status <> 'published' or publication_date is not null);
