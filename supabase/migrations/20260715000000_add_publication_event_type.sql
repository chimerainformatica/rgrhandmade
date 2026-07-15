-- VTX Events: pubblicazioni editoriali con copertina e senza pagina dettaglio.

alter table public.news drop constraint if exists news_type_check;
alter table public.news
  add constraint news_type_check
  check (type in ('event', 'fiera', 'press', 'publication'));

update public.news
set
  type = 'publication',
  category = 'Pubblicazioni',
  updated_at = now()
where type = 'press'
  and regexp_replace(lower(coalesce(category, '')), '\s+', '', 'g') = 'pubblicazioni';

